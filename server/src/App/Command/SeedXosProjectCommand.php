<?php

namespace App\Command;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\Card;
use Board\Entity\Label;
use Board\Entity\Workspace;
use Board\Repository\WorkspaceRepository;
use Board\Service\BoardManager;
use IBlock\Entity\Block;
use IBlock\Entity\Element;
use IBlock\Entity\Property;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Entity\Section;
use IBlock\Entity\Type;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\ElementRepository;
use IBlock\Repository\PropertyEnumRepository;
use IBlock\Repository\PropertyRepository;
use IBlock\Repository\SectionRepository;
use IBlock\Repository\TypeRepository;
use IBlock\Service\BlockManager;
use IBlock\Service\ElementManager;
use IBlock\Service\PropertyEnumManager;
use IBlock\Service\PropertyManager;
use IBlock\Service\SectionManager;
use IBlock\Service\TypeManager;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Pkb\Entity\Vault;
use Pkb\Repository\VaultRepository;
use Pkb\Service\PkbManager;
use Pkb\Service\VaultFileService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'xos:seed-project',
    description: 'Создаёт workspace/доску и vault PKB для проекта XOS со связью карточек и заметок',
)]
final class SeedXosProjectCommand extends Command
{
    private const WORKSPACE_NAME = 'XOS';
    private const BOARD_TITLE = 'XOS — roadmap';
    private const VAULT_SLUG = 'xos';

    public function __construct(
        private readonly UserRepository $users,
        private readonly WorkspaceRepository $workspaces,
        private readonly VaultRepository $vaults,
        private readonly BoardManager $boardManager,
        private readonly PkbManager $pkbManager,
        private readonly VaultFileService $vaultFiles,
        private readonly TypeRepository $iblockTypes,
        private readonly BlockRepository $iblockBlocks,
        private readonly SectionRepository $iblockSections,
        private readonly PropertyRepository $iblockProperties,
        private readonly PropertyEnumRepository $iblockPropertyEnums,
        private readonly ElementRepository $iblockElements,
        private readonly TypeManager $typeManager,
        private readonly BlockManager $blockManager,
        private readonly SectionManager $sectionManager,
        private readonly PropertyManager $propertyManager,
        private readonly PropertyEnumManager $propertyEnumManager,
        private readonly ElementManager $elementManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('login', null, InputOption::VALUE_REQUIRED, 'Логин владельца (по умолчанию — первый пользователь)')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Пересоздать, если уже есть');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $user = $this->resolveUser($input->getOption('login'));
        $force = (bool) $input->getOption('force');

        $io->title('XOS project seed');
        $io->text(sprintf('Владелец: %s (id=%d)', $user->getLogin() ?? '?', $user->getId() ?? 0));

        $vault = $this->seedVault($io, $user, $force);
        $board = $this->seedBoard($io, $user, $force, $vault);
        $content = $this->seedContentCatalog($io);
        $this->syncAppIdeas($io, $user);

        $io->success([
            $vault ? sprintf('Vault «XOS» slug=%s id=%d', self::VAULT_SLUG, $vault->getId()) : 'Vault пропущен',
            $board ? sprintf('Доска «%s» id=%d', self::BOARD_TITLE, $board->getId()) : 'Доска пропущена',
            $content
                ? sprintf('IBlock content: type=#%d notes=#%d recipes=#%d', $content['type_id'], $content['notes_id'], $content['recipes_id'])
                : 'IBlock content пропущен',
        ]);

        return Command::SUCCESS;
    }

    /**
     * Идемпотентно кладёт App Ideas в существующие vault/доску (без --force).
     */
    private function syncAppIdeas(SymfonyStyle $io, User $user): void
    {
        $io->section('Sync docs → PKB + Board');

        $vault = $this->vaults->findOneByOwnerAndSlug($user, self::VAULT_SLUG);
        if ($vault instanceof Vault) {
            $written = 0;
            foreach ($this->vaultNotes() as $path => $content) {
                $this->vaultFiles->putContent($vault, $user, $path, $content);
                ++$written;
            }
            $io->text(sprintf('PKB vault id=%d: %d notes (full catalog)', $vault->getId(), $written));
        } else {
            $io->warning('Vault slug=xos не найден — PKB sync пропущен.');
        }

        $workspace = $this->findWorkspace($user);
        if (!$workspace instanceof Workspace) {
            $io->warning('Workspace «XOS» не найден — Board sync пропущен.');

            return;
        }

        $board = null;
        foreach ($this->boardManager->getBoardRepository()->findByWorkspace($workspace) as $candidate) {
            if ($candidate->getTitle() === self::BOARD_TITLE) {
                $board = $candidate;
                break;
            }
        }
        if (!$board instanceof Board) {
            $io->warning(sprintf('Доска «%s» не найдена — Board sync пропущен.', self::BOARD_TITLE));

            return;
        }

        $lists = [];
        foreach ($this->boardManager->getBoardListRepository()->findByBoardOrdered($board) as $list) {
            $lists[$list->getTitle()] = $list;
        }

        $synced = 0;
        foreach ($this->docCardCatalog() as $item) {
            $listTitle = $item['boardList'];
            if (!isset($lists[$listTitle])) {
                continue;
            }
            $this->upsertLinkedCard(
                $lists[$listTitle],
                $user,
                $vault,
                $item['title'],
                $item['description'],
                $item['notePath'],
            );
            ++$synced;
        }

        if (isset($lists['Roadmap'])) {
            $this->upsertLinkedCard(
                $lists['Roadmap'],
                $user,
                $vault,
                'Идеи приложений',
                <<<'MD'
Открытый бэклог: IMAP/Open Banking; Board email/Trello. Platform W3b+ **DONE**.

[[AppIdeas]] · `docs/APP_IDEAS.md`
MD,
                'Notes/AppIdeas.md',
            );
            ++$synced;
        }

        $io->text(sprintf('Board «%s»: upsert %d linked cards', self::BOARD_TITLE, $synced));
    }

    private function upsertLinkedCard(
        BoardList $list,
        User $user,
        ?Vault $vault,
        string $title,
        string $descriptionMd,
        string $notePath,
    ): void {
        $card = null;
        foreach ($this->boardManager->getCardRepository()->findByListOrdered($list) as $existing) {
            if ($existing->getTitle() === $title) {
                $card = $existing;
                break;
            }
        }
        if (!$card instanceof Card) {
            $card = $this->boardManager->createCard($list, $user, ['title' => $title]);
        }

        $payload = ['description_md' => $descriptionMd];
        if ($vault instanceof Vault) {
            $payload['pkb_vault_id'] = $vault->getId();
            $payload['pkb_note_path'] = $notePath;
        }
        $this->boardManager->updateCard($card, $user, $payload);
    }

    private function appIdeasNoteContent(): string
    {
        $docsPath = dirname(__DIR__, 4).DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'APP_IDEAS.md';
        if (is_file($docsPath)) {
            $raw = file_get_contents($docsPath);
            if (false !== $raw && '' !== trim($raw)) {
                return trim($raw)."\n\n← [[Home]] · [[AppsCatalog]] · [[IBlock]] · [[Changelog]]\n";
            }
        }

        $notes = $this->vaultNotes();

        return $notes['Notes/AppIdeas.md'] ?? "# App Ideas\n\nСм. `docs/APP_IDEAS.md`.\n";
    }

    /**
     * Идемпотентный seed type=content + consumer blocks для Notes/Recipes и APP_IDEAS §1.
     *
     * @return array{type_id: int, notes_id: int, recipes_id: int}|null
     */
    private function seedContentCatalog(SymfonyStyle $io): ?array
    {
        $type = $this->iblockTypes->findOneBy(['code' => 'content']);
        if (!$type instanceof Type) {
            $typeId = $this->typeManager->add([
                'code' => 'content',
                'name' => 'Контент',
                'description' => 'Notes, Recipes и consumer apps (articles, FAQ, …)',
                'sort' => 50,
                'active' => true,
                'sections' => true,
            ]);
            $type = $this->iblockTypes->find($typeId);
        }
        if (!$type instanceof Type) {
            $io->error('Не удалось создать iblock_type content');

            return null;
        }

        $notesBlock = $this->ensureBlock($type, 'notes', 'Заметки', 10);
        $recipesBlock = $this->ensureBlock($type, 'recipes', 'Рецепты', 20);
        $articlesBlock = $this->ensureBlock($type, 'articles', 'Статьи', 30);
        $faqBlock = $this->ensureBlock($type, 'faq', 'FAQ', 40);
        $galleryBlock = $this->ensureBlock($type, 'gallery', 'Галерея', 50);
        $eventsBlock = $this->ensureBlock($type, 'events', 'События', 60);
        $contactsBlock = $this->ensureBlock($type, 'contacts', 'Контакты', 70);
        $servicesBlock = $this->ensureBlock($type, 'services', 'Услуги', 80);
        $ideasBlock = $this->ensureBlock($type, 'ideas', 'Идеи', 90);
        $leadsBlock = $this->ensureBlock($type, 'leads', 'Лиды', 100);

        $this->ensureProperty($notesBlock, 'COVER', 'Обложка', 'F', true, 10, 'image');
        $this->ensureProperty($notesBlock, 'TAGS', 'Теги', 'S', true, 20);

        $this->ensureProperty($recipesBlock, 'COVER', 'Обложка', 'F', true, 10, 'image');
        $this->ensureProperty($recipesBlock, 'PREP_MIN', 'Подготовка (мин)', 'N', false, 20);
        $this->ensureProperty($recipesBlock, 'COOK_MIN', 'Готовка (мин)', 'N', false, 30);
        $this->ensureProperty($recipesBlock, 'SERVINGS', 'Порции', 'N', false, 40);
        $difficulty = $this->ensureProperty($recipesBlock, 'DIFFICULTY', 'Сложность', 'L', false, 50);
        $this->ensureEnum($difficulty, 'easy', 'Легко', 10, true);
        $this->ensureEnum($difficulty, 'medium', 'Средне', 20, false);
        $this->ensureEnum($difficulty, 'hard', 'Сложно', 30, false);
        $this->ensureProperty($recipesBlock, 'INGREDIENTS', 'Ингредиенты', 'S', true, 60);

        $this->ensureProperty($articlesBlock, 'COVER', 'Обложка', 'F', true, 10, 'image');
        $this->ensureProperty($articlesBlock, 'TAGS', 'Теги', 'S', true, 20);

        $this->ensureProperty($faqBlock, 'TAGS', 'Теги', 'S', true, 10);

        $this->ensureProperty($galleryBlock, 'COVER', 'Фото', 'F', true, 10, 'image');
        $this->ensureProperty($galleryBlock, 'CAPTION', 'Подпись', 'S', false, 20);

        $this->ensureProperty($eventsBlock, 'COVER', 'Обложка', 'F', true, 10, 'image');
        $this->ensureProperty($eventsBlock, 'TAGS', 'Теги', 'S', true, 20);
        $this->ensureProperty($eventsBlock, 'EVENT_DATE', 'Дата', 'S', false, 30);
        $this->ensureProperty($eventsBlock, 'PLACE', 'Место', 'S', false, 40);

        $this->ensureProperty($contactsBlock, 'COVER', 'Фото', 'F', false, 10, 'image');
        $this->ensureProperty($contactsBlock, 'POSITION', 'Должность', 'S', false, 20);
        $this->ensureProperty($contactsBlock, 'PHONE', 'Телефон', 'S', false, 30);
        $this->ensureProperty($contactsBlock, 'EMAIL', 'Email', 'S', false, 40);

        $this->ensureProperty($servicesBlock, 'COVER', 'Обложка', 'F', true, 10, 'image');
        $this->ensureProperty($servicesBlock, 'TAGS', 'Теги', 'S', true, 20);
        $this->ensureProperty($servicesBlock, 'PRICE', 'Цена', 'N', false, 30);

        $this->ensureProperty($ideasBlock, 'TAGS', 'Теги', 'S', true, 10);
        $ideaStatus = $this->ensureProperty($ideasBlock, 'STATUS', 'Статус', 'L', false, 20);
        $this->ensureEnum($ideaStatus, 'new', 'Новая', 10, true);
        $this->ensureEnum($ideaStatus, 'doing', 'В работе', 20, false);
        $this->ensureEnum($ideaStatus, 'done', 'Готово', 30, false);
        $this->ensureEnum($ideaStatus, 'dropped', 'Отменена', 40, false);
        $ideaPriority = $this->ensureProperty($ideasBlock, 'PRIORITY', 'Приоритет', 'L', false, 30);
        $this->ensureEnum($ideaPriority, 'low', 'Низкий', 10, false);
        $this->ensureEnum($ideaPriority, 'medium', 'Средний', 20, true);
        $this->ensureEnum($ideaPriority, 'high', 'Высокий', 30, false);

        $this->ensureProperty($leadsBlock, 'TAGS', 'Теги', 'S', true, 10);
        $leadStage = $this->ensureProperty($leadsBlock, 'STAGE', 'Стадия', 'L', false, 20);
        $this->ensureEnum($leadStage, 'new', 'Новый', 10, true);
        $this->ensureEnum($leadStage, 'contacted', 'На связи', 20, false);
        $this->ensureEnum($leadStage, 'qualified', 'Квалифицирован', 30, false);
        $this->ensureEnum($leadStage, 'won', 'Выигран', 40, false);
        $this->ensureEnum($leadStage, 'lost', 'Потерян', 50, false);
        $leadPriority = $this->ensureProperty($leadsBlock, 'PRIORITY', 'Приоритет', 'L', false, 30);
        $this->ensureEnum($leadPriority, 'low', 'Низкий', 10, false);
        $this->ensureEnum($leadPriority, 'medium', 'Средний', 20, true);
        $this->ensureEnum($leadPriority, 'high', 'Высокий', 30, false);
        $this->ensureProperty($leadsBlock, 'CONTACT', 'Контакт', 'S', false, 40);

        $personal = $this->ensureSection($notesBlock, 'personal', 'Личное', 10);
        $work = $this->ensureSection($notesBlock, 'work', 'Работа', 20);
        $soups = $this->ensureSection($recipesBlock, 'soups', 'Супы', 10);
        $mains = $this->ensureSection($recipesBlock, 'mains', 'Основные блюда', 20);
        $desserts = $this->ensureSection($recipesBlock, 'desserts', 'Десерты', 30);
        $news = $this->ensureSection($articlesBlock, 'news', 'Новости', 10);
        $blog = $this->ensureSection($articlesBlock, 'blog', 'Блог', 20);
        $faqGeneral = $this->ensureSection($faqBlock, 'general', 'Общее', 10);
        $faqTech = $this->ensureSection($faqBlock, 'tech', 'Техника', 20);
        $albums = $this->ensureSection($galleryBlock, 'albums', 'Альбомы', 10);
        $upcoming = $this->ensureSection($eventsBlock, 'upcoming', 'Анонсы', 10);
        $staff = $this->ensureSection($contactsBlock, 'staff', 'Сотрудники', 10);
        $svcCatalog = $this->ensureSection($servicesBlock, 'catalog', 'Каталог', 10);
        $inbox = $this->ensureSection($ideasBlock, 'inbox', 'Inbox', 10);
        $pipeline = $this->ensureSection($leadsBlock, 'pipeline', 'Воронка', 10);

        $this->ensureElement($notesBlock, 'welcome-note', 'Добро пожаловать', [
            'preview_text' => 'Первая заметка в каталоге',
            'detail_text' => "# Добро пожаловать\n\nЭто **заметка** на IBlock. Редактируйте как markdown и вставляйте картинки.\n",
            'section_ids' => [$personal->getId()],
            'PROPERTY_VALUES' => ['TAGS' => ['intro', 'xos']],
            'sort' => 10,
        ]);
        $this->ensureElement($notesBlock, 'meeting-notes', 'Заметки со встречи', [
            'preview_text' => 'Черновик протокола',
            'detail_text' => "## Повестка\n\n- Статус IBlock\n- Notes + Recipes apps\n\n## Решения\n\n1. Хранить на IBlock\n2. Markdown + upload картинок\n",
            'section_ids' => [$work->getId()],
            'PROPERTY_VALUES' => ['TAGS' => ['meeting']],
            'sort' => 20,
        ]);

        $this->ensureElement($recipesBlock, 'tomato-soup', 'Томатный суп', [
            'preview_text' => 'Простой суп за 30 минут',
            'detail_text' => "## Приготовление\n\n1. Обжарьте лук и чеснок.\n2. Добавьте томаты и бульон.\n3. Проварите 15 минут, взбейте блендером.\n\nПодавайте с зеленью.\n",
            'section_ids' => [$soups->getId()],
            'PROPERTY_VALUES' => [
                'PREP_MIN' => 10,
                'COOK_MIN' => 20,
                'SERVINGS' => 4,
                'DIFFICULTY' => 'easy',
                'INGREDIENTS' => [
                    'лук — 1 шт.',
                    'чеснок — 2 зубчика',
                    'томаты — 800 г',
                    'бульон — 500 мл',
                ],
            ],
            'sort' => 10,
        ]);
        $this->ensureElement($recipesBlock, 'pancakes', 'Блины', [
            'preview_text' => 'Классические блины',
            'detail_text' => "## Приготовление\n\n1. Смешайте муку, яйца и молоко.\n2. Жарьте на смазанной сковороде с двух сторон.\n",
            'section_ids' => [$desserts->getId(), $mains->getId()],
            'PROPERTY_VALUES' => [
                'PREP_MIN' => 15,
                'COOK_MIN' => 25,
                'SERVINGS' => 6,
                'DIFFICULTY' => 'medium',
                'INGREDIENTS' => [
                    'мука — 300 г',
                    'молоко — 500 мл',
                    'яйца — 2 шт.',
                    'соль — щепотка',
                ],
            ],
            'sort' => 20,
        ]);

        $this->ensureElement($articlesBlock, 'hello-xos', 'Первая статья', [
            'preview_text' => 'Анонс для блога',
            'detail_text' => "# Hello XOS\n\nСтатья на IBlock consumer `articles`.\n",
            'section_ids' => [$blog->getId(), $news->getId()],
            'PROPERTY_VALUES' => ['TAGS' => ['intro']],
            'sort' => 10,
        ]);
        $this->ensureElement($faqBlock, 'what-is-xos', 'Что такое XOS?', [
            'detail_text' => "XOS — desktop-shell с приложениями на общем backend.\n",
            'section_ids' => [$faqGeneral->getId()],
            'PROPERTY_VALUES' => ['TAGS' => ['basics']],
            'sort' => 10,
        ]);
        $this->ensureElement($galleryBlock, 'sample-photo', 'Пример фото', [
            'detail_text' => 'Загрузите изображения в свойство COVER.',
            'section_ids' => [$albums->getId()],
            'PROPERTY_VALUES' => ['CAPTION' => 'Демо альбома'],
            'sort' => 10,
        ]);
        $this->ensureElement($eventsBlock, 'meetup', 'Встреча команды', [
            'preview_text' => 'Еженедельный sync',
            'detail_text' => "## Повестка\n\n- Статус\n- Планы\n",
            'section_ids' => [$upcoming->getId()],
            'PROPERTY_VALUES' => [
                'TAGS' => ['team'],
                'EVENT_DATE' => '2026-10-01 15:00',
                'PLACE' => 'Офис / Zoom',
            ],
            'sort' => 10,
        ]);
        $this->ensureElement($contactsBlock, 'demo-contact', 'Иван Иванов', [
            'detail_text' => 'Контакт для демо.',
            'section_ids' => [$staff->getId()],
            'PROPERTY_VALUES' => [
                'POSITION' => 'Разработчик',
                'PHONE' => '+7 900 000-00-00',
                'EMAIL' => 'ivan@example.com',
            ],
            'sort' => 10,
        ]);
        $this->ensureElement($servicesBlock, 'consulting', 'Консультация', [
            'preview_text' => 'Час с экспертом',
            'detail_text' => "Описание услуги.\n",
            'section_ids' => [$svcCatalog->getId()],
            'PROPERTY_VALUES' => [
                'TAGS' => ['consult'],
                'PRICE' => 5000,
            ],
            'sort' => 10,
        ]);
        $this->ensureElement($ideasBlock, 'wishlist-item', 'Ещё один consumer-app', [
            'preview_text' => 'Идея из бэклога',
            'detail_text' => "Черновик идеи для wishlist.\n",
            'section_ids' => [$inbox->getId()],
            'PROPERTY_VALUES' => [
                'TAGS' => ['backlog'],
                'STATUS' => 'new',
                'PRIORITY' => 'medium',
            ],
            'sort' => 10,
        ]);
        $this->ensureElement($leadsBlock, 'demo-lead', 'Acme Corp', [
            'preview_text' => 'Демо-лид CRM',
            'detail_text' => "Запрос на пилот XOS.\n",
            'section_ids' => [$pipeline->getId()],
            'PROPERTY_VALUES' => [
                'TAGS' => ['inbound'],
                'STAGE' => 'new',
                'PRIORITY' => 'high',
                'CONTACT' => 'alice@acme.example',
            ],
            'sort' => 10,
        ]);

        $io->text(sprintf(
            'IBlock content: type=#%d notes=#%d recipes=#%d + articles/faq/gallery/events/contacts/services/ideas/leads',
            $type->getId(),
            $notesBlock->getId(),
            $recipesBlock->getId(),
        ));

        return [
            'type_id' => (int) $type->getId(),
            'notes_id' => (int) $notesBlock->getId(),
            'recipes_id' => (int) $recipesBlock->getId(),
        ];
    }

    private function ensureBlock(Type $type, string $code, string $name, int $sort): Block
    {
        $block = $this->iblockBlocks->findOneBy(['code' => $code, 'type' => $type]);
        if ($block instanceof Block) {
            return $block;
        }
        $id = $this->blockManager->add([
            'code' => $code,
            'name' => $name,
            'type_id' => $type->getId(),
            'sort' => $sort,
            'active' => true,
            'sections' => true,
            'property' => true,
            'section_mode' => 'bind',
        ]);
        $block = $this->iblockBlocks->find($id);
        if (!$block instanceof Block) {
            throw new \RuntimeException(sprintf('Failed to create block %s', $code));
        }

        return $block;
    }

    private function ensureProperty(
        Block $block,
        string $code,
        string $name,
        string $fieldType,
        bool $multiple,
        int $sort,
        ?string $fileType = null,
    ): Property {
        $property = $this->iblockProperties->findOneBy(['code' => $code, 'block' => $block]);
        if ($property instanceof Property) {
            $payload = [];
            if (strtoupper((string) $property->getFieldType()) !== strtoupper($fieldType)) {
                $payload['field_type'] = $fieldType;
            }
            if ($property->isMultiple() !== $multiple) {
                $payload['multiple'] = $multiple;
            }
            if (null !== $fileType) {
                $current = $property->getFileType();
                $wanted = '' === trim($fileType) ? null : $fileType;
                if ($current !== $wanted) {
                    $payload['file_type'] = $wanted;
                }
            }
            if ($payload !== []) {
                $this->propertyManager->update((int) $property->getId(), $payload);
                $property = $this->iblockProperties->find($property->getId()) ?? $property;
            }

            return $property;
        }
        $id = $this->propertyManager->add([
            'code' => $code,
            'name' => $name,
            'block_id' => $block->getId(),
            'field_type' => $fieldType,
            'multiple' => $multiple,
            'file_type' => $fileType,
            'sort' => $sort,
            'active' => true,
            'list_type' => 'L' === $fieldType ? 'L' : 's',
        ]);
        $property = $this->iblockProperties->find($id);
        if (!$property instanceof Property) {
            throw new \RuntimeException(sprintf('Failed to create property %s', $code));
        }

        return $property;
    }

    private function ensureEnum(Property $property, string $code, string $name, int $sort, bool $default): void
    {
        $existing = $this->iblockPropertyEnums->findOneBy(['code' => $code, 'property' => $property]);
        if ($existing instanceof PropertyEnum) {
            return;
        }
        $this->propertyEnumManager->add([
            'code' => $code,
            'name' => $name,
            'property_id' => $property->getId(),
            'sort' => $sort,
            'default' => $default,
        ]);
    }

    private function ensureSection(Block $block, string $code, string $name, int $sort): Section
    {
        $section = $this->iblockSections->findOneBy(['code' => $code, 'block' => $block]);
        if ($section instanceof Section) {
            return $section;
        }
        $id = $this->sectionManager->add([
            'code' => $code,
            'name' => $name,
            'block_id' => $block->getId(),
            'sort' => $sort,
            'active' => true,
        ]);
        $section = $this->iblockSections->find($id);
        if (!$section instanceof Section) {
            throw new \RuntimeException(sprintf('Failed to create section %s', $code));
        }

        return $section;
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function ensureElement(Block $block, string $code, string $name, array $fields): void
    {
        $existing = $this->iblockElements->findOneBy(['code' => $code, 'block' => $block]);
        if ($existing instanceof Element) {
            return;
        }
        $this->elementManager->add(array_merge([
            'code' => $code,
            'name' => $name,
            'block_id' => $block->getId(),
            'active' => true,
        ], $fields));
    }

    private function resolveUser(?string $login): User
    {
        if (is_string($login) && '' !== trim($login)) {
            $user = $this->users->findOneBy(['login' => trim($login)]);
            if (!$user instanceof User) {
                throw new \RuntimeException(sprintf('Пользователь «%s» не найден', $login));
            }

            return $user;
        }

        $user = $this->users->findOneBy([], ['id' => 'ASC']);
        if (!$user instanceof User) {
            throw new \RuntimeException('В БД нет пользователей. Укажите --login или создайте пользователя.');
        }

        return $user;
    }

    private function findWorkspace(User $user): ?Workspace
    {
        foreach ($this->workspaces->findAccessibleForUser($user) as $workspace) {
            if ($workspace->getName() === self::WORKSPACE_NAME) {
                return $workspace;
            }
        }

        return null;
    }

    private function seedVault(SymfonyStyle $io, User $user, bool $force): ?Vault
    {
        $existing = $this->vaults->findOneByOwnerAndSlug($user, self::VAULT_SLUG);
        if ($existing instanceof Vault) {
            if (!$force) {
                $io->warning('Vault slug=xos уже есть — не создан (используйте --force).');

                return null;
            }
            $this->pkbManager->deleteVault($existing, $user, true);
            $io->note('Старый vault xos удалён.');
        }

        $vault = $this->pkbManager->createVault($user, [
            'name' => 'XOS',
            'slug' => self::VAULT_SLUG,
        ]);

        $this->vaultFiles->createFolder($vault, $user, 'Notes/Apps');
        $this->vaultFiles->createFolder($vault, $user, 'Notes/Apps/IBlock');

        foreach ($this->vaultNotes() as $path => $content) {
            $this->vaultFiles->putContent($vault, $user, $path, $content);
        }

        $io->text(sprintf('Vault id=%d path=%s (%d notes)', $vault->getId(), $vault->getRootPath(), \count($this->vaultNotes())));

        return $vault;
    }

    private function seedBoard(SymfonyStyle $io, User $user, bool $force, ?Vault $vault): ?Board
    {
        $existing = $this->findWorkspace($user);
        if ($existing instanceof Workspace) {
            if (!$force) {
                $io->warning('Workspace «XOS» уже есть — доска не создана (используйте --force).');

                return null;
            }
            $this->boardManager->deleteWorkspace($existing, $user);
            $io->note('Старый workspace XOS удалён.');
        }

        $workspace = $this->boardManager->createWorkspace($user, [
            'name' => self::WORKSPACE_NAME,
            'description' => 'Монорепозиторий XOS: desktop-shell, приложения и документация.',
        ]);

        $board = $this->boardManager->createBoard($workspace, $user, [
            'title' => self::BOARD_TITLE,
            'description' => 'Структура XOS: обзор, модули (связаны с vault), roadmap.',
            'background_type' => 'color',
            'background_value' => '#1b2838',
            'visibility' => 'workspace',
        ]);

        $labels = $this->createLabels($board, $user);
        $lists = [];
        foreach (['Обзор', 'Модули', 'Roadmap'] as $title) {
            $lists[$title] = $this->boardManager->createList($board, $user, ['title' => $title]);
        }

        $this->addLinkedDocCards($user, $lists, $labels, $vault);
        $this->addRoadmapCards($user, $lists, $labels, $vault);

        $io->text(sprintf('Созданы workspace id=%d, board id=%d', $workspace->getId(), $board->getId()));

        return $board;
    }

    /**
     * @return array<string, Label>
     */
    private function createLabels(Board $board, User $user): array
    {
        $defs = [
            'docs' => '#5c6bc0',
            'module' => '#26a69a',
            'bug' => '#e53935',
            'mvp' => '#43a047',
            'v2' => '#fb8c00',
            'main' => '#546e7a',
            'device' => '#6d4c41',
            'explorer' => '#00897b',
            'schooltask' => '#8e24aa',
            'inccom' => '#2e7d32',
            'calendar' => '#1976d2',
            'todo' => '#ef6c00',
            'board' => '#3949ab',
            'pkb' => '#00838f',
            'system' => '#78909c',
            'iblock' => '#5d4037',
            'assets' => '#455a64',
            'content' => '#6a1b9a',
            'github' => '#24292e',
            'inbox' => '#0277bd',
        ];
        $result = [];
        foreach ($defs as $name => $color) {
            $result[$name] = $this->boardManager->createLabel($board, $user, [
                'name' => $name,
                'color' => $color,
            ]);
        }

        return $result;
    }

    /**
     * @param array<string, BoardList> $lists
     * @param array<string, Label> $labels
     */
    private function addLinkedDocCards(User $user, array $lists, array $labels, ?Vault $vault): void
    {
        foreach ($this->docCardCatalog() as $item) {
            $listTitle = $item['boardList'];
            if (!isset($lists[$listTitle])) {
                continue;
            }
            $card = $this->boardManager->createCard($lists[$listTitle], $user, ['title' => $item['title']]);
            $this->boardManager->updateCard($card, $user, [
                'description_md' => $item['description'],
            ]);
            $this->applyLabels($card, $user, $labels, $item['labels']);
            if ($vault instanceof Vault) {
                $this->boardManager->updateCard($card, $user, [
                    'pkb_vault_id' => $vault->getId(),
                    'pkb_note_path' => $item['notePath'],
                ]);
            }
        }
    }

    /**
     * @param array<string, BoardList> $lists
     * @param array<string, Label> $labels
     */
    private function addRoadmapCards(User $user, array $lists, array $labels, ?Vault $vault): void
    {
        $card = function (
            string $title,
            string $description,
            array $labelKeys = [],
            ?array $checklist = null,
            ?string $pkbNotePath = null,
        ) use ($user, $lists, $labels, $vault): void {
            $created = $this->boardManager->createCard($lists['Roadmap'], $user, ['title' => $title]);
            $this->boardManager->updateCard($created, $user, ['description_md' => $description]);
            $this->applyLabels($created, $user, $labels, $labelKeys);
            if ($checklist !== null) {
                $cl = $this->boardManager->createChecklist($created, $user, ['title' => $checklist['title']]);
                foreach ($checklist['items'] as $item) {
                    $this->boardManager->addChecklistItem($cl, $user, ['text' => $item]);
                }
            }
            if ($vault instanceof Vault && null !== $pkbNotePath && '' !== $pkbNotePath) {
                $this->boardManager->updateCard($created, $user, [
                    'pkb_vault_id' => $vault->getId(),
                    'pkb_note_path' => $pkbNotePath,
                ]);
            }
        };

        $card(
            'Волна 1 IncCom+DX — DONE',
            <<<'MD'
Сдано: позиции из чека ФНС, шифрование `master_token`, DX Board↔PKB.

Детали: [[Changelog]] · [[IncCom]] · `docs/inccom/README.md` · [[Board]]↔[[PKB]].
MD,
            ['inccom', 'docs', 'mvp'],
            [
                'title' => 'Критерии',
                'items' => [
                    'Позиции из receipt_json (fill_items / apply-items)',
                    'Encrypt FNS master_token (INCCOM_FNS_SECRET)',
                    'API_SPEC Board↔PKB + PHPUnit linked',
                ],
            ],
            'Notes/Changelog.md',
        );

        $card(
            'Волна 2 SchoolTask+Explorer — DONE',
            <<<'MD'
Сдано: SchoolTask Critical B1–B3 / F1–F3; Explorer dirty-close.

Детали: [[Changelog]] · [[SchoolTask]] · [[Explorer]].
MD,
            ['schooltask', 'explorer', 'docs', 'mvp'],
            [
                'title' => 'Критерии',
                'items' => [
                    'B1/B2 права тьютор|scopes; B3 JWT download task files',
                    'F1 user_ids, F2 FormData, F3 calendar-editor launch',
                    'Explorer dirty-close + taskbar getWindowApi',
                ],
            ],
            'Notes/Changelog.md',
        );
        $card('Волна 3 Board — partial (polling+search)', <<<'MD'
Сдано: Board changes polling + global card search.

**W3b DONE:** SSE `/events` + optional Mercure (`/realtime`) + conflict UI. Остаток: Trello import; email.

См. [[Board]], [[Changelog]].
MD, ['board', 'docs', 'mvp']);

        $card('W3b PKB: templates/graph, encryption, plugins', <<<'MD'
**DONE:** FULLTEXT; ambiguous UX; encrypt_at_rest; plugins_json; ZIP export; remote_sync_url + POST `/remote-sync`.

Остаток: co-editing; plugin marketplace.

См. [[PKB]], [[AppIdeas]], `docs/APP_IDEAS.md`.
MD, ['pkb', 'mvp']);

        $card('Apps wave — homework, CRM, GitHub, habits, Inbox', <<<'MD'
**DONE:** `schooltask-homeworks` + parent share; IncCom bank UI; `leads`/`lead`; `github`; `habits`; `inbox`/`inbox-message`; tags/favorites.

См. [[AppsCatalog]] · [[Changelog]] · [[SchoolTask]] · [[GitHub]] · [[Inbox]] · [[Habits]] · [[Content]]
MD, ['docs', 'mvp', 'schooltask']);

        $card('Документация приложений', <<<'MD'
Каталог `docs/APPS.md`, ТЗ по доменам, индекс `docs/README.md`. Связано с [[AppsCatalog]], [[Changelog]] и vault XOS.
MD, ['docs', 'mvp'], [
            'title' => 'Осталось',
            'items' => [
                'Сверять ТЗ с кодом при крупных фичах',
                'Сверять seed Board/PKB с `docs/` после крупных фич',
            ],
        ]);

        $card(
            'Идеи приложений',
            <<<'MD'
Открытый бэклог. **W3b/Platform+ DONE** (Mercure, remote PKB sync, OU v2, outbox). Дальше: IMAP/Open Banking.

[[AppIdeas]] · `docs/APP_IDEAS.md`
MD,
            ['docs', 'v2'],
            [
                'title' => 'Быстрый старт',
                'items' => [
                    'IMAP / Open Banking',
                    'Board email / Trello import',
                    'PKB co-edit',
                ],
            ],
            'Notes/AppIdeas.md',
        );
    }

    /**
     * @param array<string, Label> $labels
     * @param list<string> $labelKeys
     */
    private function applyLabels(Card $card, User $user, array $labels, array $labelKeys): void
    {
        $ids = [];
        foreach ($labelKeys as $key) {
            if (isset($labels[$key])) {
                $ids[] = (int) $labels[$key]->getId();
            }
        }
        if ($ids !== []) {
            $this->boardManager->setCardLabels($card, $user, $ids);
        }
    }

    /**
     * Карточки Обзор + Модули, привязанные к заметкам.
     *
     * @return list<array{title: string, notePath: string, boardList: string, labels: list<string>, description: string}>
     */
    private function docCardCatalog(): array
    {
        $overview = [
            [
                'title' => 'Home',
                'notePath' => 'Notes/Home.md',
                'boardList' => 'Обзор',
                'labels' => ['docs'],
                'description' => "Точка входа в проектную базу знаний XOS.\n\nОткройте связанную заметку [[Home]].",
            ],
            [
                'title' => 'Architecture',
                'notePath' => 'Notes/Architecture.md',
                'boardList' => 'Обзор',
                'labels' => ['docs'],
                'description' => "Слои monorepo, auth, клиент/сервер.\n\nСм. [[Architecture]] и модули в vault.",
            ],
            [
                'title' => 'Apps Catalog',
                'notePath' => 'Notes/AppsCatalog.md',
                'boardList' => 'Обзор',
                'labels' => ['docs'],
                'description' => "Реестр 100+ приложений (System…Assets) и типов манифестов.\n\nСм. [[AppsCatalog]] и `docs/APPS.md`.",
            ],
            [
                'title' => 'App Ideas',
                'notePath' => 'Notes/AppIdeas.md',
                'boardList' => 'Обзор',
                'labels' => ['docs', 'v2'],
                'description' => "Открытый бэклог: SchoolTask/IncCom apps, W3b, PWA+.\n\n[[AppIdeas]] · `docs/APP_IDEAS.md`.",
            ],
            [
                'title' => 'Changelog',
                'notePath' => 'Notes/Changelog.md',
                'boardList' => 'Обзор',
                'labels' => ['docs', 'mvp'],
                'description' => "Журнал сдач: волны 1–2, content/assets, bridges, platform.\n\nСм. [[Changelog]].",
            ],
        ];

        $iblockDocs = [
            [
                'title' => 'IBlock Fields',
                'notePath' => 'Notes/Apps/IBlock/Fields.md',
                'boardList' => 'Модули',
                'labels' => ['iblock', 'docs'],
                'description' => "Bitrix fields → XOS mapping.\n\nЗаметка: [[IBlock Fields]] · hub [[IBlock]]",
            ],
            [
                'title' => 'IBlock API',
                'notePath' => 'Notes/Apps/IBlock/API.md',
                'boardList' => 'Модули',
                'labels' => ['iblock', 'docs'],
                'description' => "REST `/api/iblock/*`, managers, filters.\n\nЗаметка: [[IBlock API]]",
            ],
            [
                'title' => 'IBlock Sections',
                'notePath' => 'Notes/Apps/IBlock/Sections.md',
                'boardList' => 'Модули',
                'labels' => ['iblock', 'docs'],
                'description' => "section_element M:N, section_mode, element_filter.\n\nЗаметка: [[IBlock Sections]]",
            ],
            [
                'title' => 'IBlock Properties',
                'notePath' => 'Notes/Apps/IBlock/Properties.md',
                'boardList' => 'Модули',
                'labels' => ['iblock', 'docs'],
                'description' => "Свойства S/N/F/L/E/G + PROPERTY_VALUES.\n\nЗаметка: [[IBlock Properties]]",
            ],
            [
                'title' => 'IBlock Frontend',
                'notePath' => 'Notes/Apps/IBlock/Frontend.md',
                'boardList' => 'Модули',
                'labels' => ['iblock', 'docs'],
                'description' => "Desktop apps iblock-* и фильтры списков.\n\nЗаметка: [[IBlock Frontend]]",
            ],
        ];

        $modules = [];
        foreach ($this->moduleCatalog() as $mod) {
            $modules[] = [
                'title' => $mod['title'],
                'notePath' => $mod['notePath'],
                'boardList' => 'Модули',
                'labels' => array_values(array_unique(array_merge(['module', 'docs'], $mod['labels']))),
                'description' => $mod['cardDescription'],
            ];
        }

        return array_merge($overview, $modules, $iblockDocs);
    }

    /**
     * @return list<array{title: string, notePath: string, labels: list<string>, cardDescription: string, body: string}>
     */
    private function moduleCatalog(): array
    {
        return [
            [
                'title' => 'Main',
                'notePath' => 'Notes/Apps/Main.md',
                'labels' => ['main'],
                'cardDescription' => "Пользователи, OU, группы, claimants.\n\nЗаметка: [[Main]] · API `/api/main/`",
                'body' => <<<'MD'
# Main

Claimant `main` · роль `ROLE_MAIN` · `server/src/Main/` · `client/src/features/main/` · `client/src/apps/main-*`

## Назначение

Администрирование: пользователи, подразделения (OU), группы, каталог прав (claimants), файлы, настройки аккаунта.

## Приложения (app id)

| ID | Тип |
|----|-----|
| `main-users` / `main-user` | список / карточка |
| `main-groups` / `main-group` | список / карточка |
| `main-ous` / `main-ou` | список / карточка |
| `main-claimants` / `main-claimant` | список / карточка |
| `main-audit` | журнал аудита (`main.audit` can_read) |

## Ключевое

- JWT scopes из `setting.json` + sync в БД: `php bin/console main:claimant:sync`
- UI прав: `access_options` в claimant после sync
- Аудит: `AuditLog` + app `main-audit`
- Multi-OU: `main.active_ou_id`; list/create scope (Device via createdBy.ou; Assets `ou_id`)
- Документы: `docs/main/README.md`, `docs/main/TZ.md`

← [[Home]] · [[Architecture]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Device',
                'notePath' => 'Notes/Apps/Device.md',
                'labels' => ['device'],
                'cardDescription' => "Учёт оборудования, ПО, лицензии.\n\nЗаметка: [[Device]] · API `/api/device/`",
                'body' => <<<'MD'
# Device

Claimant `device` · `server/src/Device/` · `client/src/features/device/` · apps `device-*`

## Назначение

Инвентаризация: устройства, комплектующие, типы, свойства, программы, лицензии и ключи.

## Приложения (app id)

`device-devices`, `device-device`, `device-sub-devices`, `device-sub-device`, `device-types`, `device-type`, `device-properties`, `device-property`, `device-components`, `device-component`, `device-softwares`, `device-software`, `device-software-types`, `device-software-type`, `device-licenses`, `device-license`, `device-license-key`

## Ключевое

- Карточка устройства: свойства, ремонты, изображения, файлы
- Multi-OU list: filter через `createdBy.ou` + `main.active_ou_id`
- Документы: `docs/device/README.md`, `docs/device/TZ.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Explorer',
                'notePath' => 'Notes/Apps/Explorer.md',
                'labels' => ['explorer'],
                'cardDescription' => "VFS, pickers, viewers (PDF/code/diff/map/media).\n\nЗаметка: [[Explorer]] · API `/api/explorer/`",
                'body' => <<<'MD'
# Explorer

Claimant `explorer` · `ROLE_EXPLORER` · `requiredRole: explorer` + `canReadExplorer` · `server/src/Explorer/` · apps `explorer*`

## Назначение

Файловая система пользователя, Open/Save pickers, редакторы и просмотрщики.

## Приложения (app id)

| ID | Примечание |
|----|------------|
| `explorer` | проводник, multi-instance |
| `explorer-open-picker` / `explorer-save-picker` | диалоги |
| `explorer-notepad` / `explorer-markdown-viewer` | текст / MD |
| `explorer-code-viewer` | код |
| `explorer-pdf-viewer` | PDF |
| `explorer-office-viewer` | DOCX |
| `explorer-diff` | сравнение |
| `explorer-map-viewer` | GPX/KML |
| `explorer-image-viewer` / `explorer-archiver` | изображения / архивы |
| `explorer-audio-player` / `explorer-video-player` | media, single-instance |

## Ключевое

- Persist: `WIN.documentPath`
- Dirty-close notepad/markdown (save / discard / cancel); taskbar → `getWindowApi().close()`
- Документы: `docs/explorer/`

← [[Home]] · [[PKB]] (vault = папка Explorer) · [[Calendar]]
MD,
            ],
            [
                'title' => 'SchoolTask',
                'notePath' => 'Notes/Apps/SchoolTask.md',
                'labels' => ['schooltask'],
                'cardDescription' => "Расписание, классы, уроки.\n\nЗаметка: [[SchoolTask]] · API `/api/schooltask/`",
                'body' => <<<'MD'
# SchoolTask

Claimant `schooltask` · `server/src/SchoolTask/` · `client/src/features/schooltask/` · apps `schooltask-*`

## Назначение

Предметы → классы → расписание → уроки учителя. Overlay «Моё расписание» в [[Calendar]].

## Приложения (app id)

| ID | Назначение |
|----|------------|
| `schooltask-subjects` / `schooltask-subject` | справочник предметов |
| `schooltask-classes` / `schooltask-class` | классы (+ вкладка «Родители» / share) |
| `schooltask-calendars` / `schooltask-calendar` / `schooltask-calendar-editor` | расписание |
| `schooltask-calendar-teacher` | мои уроки |
| `schooltask-homeworks` | агрегатор ДЗ (`EpEvent.ht`, `GET /homework`) |

## Ключевое

- Parent read-only: `st_ep_group_share`
- Документы: `docs/schooltask/README.md`, `TZ.md`

← [[Home]] · [[Calendar]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'IncCom',
                'notePath' => 'Notes/Apps/IncCom.md',
                'labels' => ['inccom'],
                'cardDescription' => "Доходы и расходы, чеки ФНС → позиции.\n\nЗаметка: [[IncCom]] · [[Changelog]] · API `/api/IncCom/`",
                'body' => <<<'MD'
# IncCom

Claimant `inccom` (`can_read` / `can_write`) · `server/src/IncCom/` · `client/src/features/inccom/` · app `inccom`

## Назначение

Счета, категории, транзакции (доход/расход), переводы, товары. QR фискальных полей; проверка чека через OpenAPI ФНС (per-user credentials, `receipt_json` на транзакции).

## Приложения

| ID | Название |
|----|----------|
| `inccom` | Доходы и расходы |

## Чеки ФНС (Волна 1)

- Credentials: `GET/PUT/DELETE /api/IncCom/fns/credentials`
- Preview: `POST /api/IncCom/receipts/preview`
- Fetch: `POST …/transactions/{id}/receipt/fetch` (+ `fill_items=true` в body/query)
- Позиции из сохранённого чека: `POST …/transactions/{id}/receipt/apply-items`
- UI: «Проверить и сохранить чек» (с `fill_items`) и «Заполнить позиции из чека»
- At rest: `INCCOM_FNS_SECRET` → AES-256-GCM (`enc:v1:`); legacy plaintext принимается до следующего PUT

## Мосты

- Soft-link устройство: `deviceId` на транзакции → [[Device]]

## Ключевое

- API: `/api/IncCom/`
- Документы: `docs/inccom/README.md`, `TZ.md` · журнал: [[Changelog]]

← [[Home]] · [[AppsCatalog]] · [[Changelog]] · [[Device]]
MD,
            ],
            [
                'title' => 'Calendar',
                'notePath' => 'Notes/Apps/Calendar.md',
                'labels' => ['calendar'],
                'cardDescription' => "Личные календари + overlay.\n\nЗаметка: [[Calendar]] · API `/api/calendar/`",
                'body' => <<<'MD'
# Calendar

Claimant `calendar` · `ROLE_CALENDAR` · `requiredRole: calendar` · `server/src/Calendar/` · app `calendar`

## Назначение

Личные календари, шаринг, overlay сроков из других модулей.

## Overlay

| Источник | Поле |
|----------|------|
| [[Todo]] | `due_at` |
| [[Board]] | `due_date` |
| [[SchoolTask]] | teacher events |

## Приложения

`calendar`

← [[Home]]
MD,
            ],
            [
                'title' => 'Todo',
                'notePath' => 'Notes/Apps/Todo.md',
                'labels' => ['todo'],
                'cardDescription' => "Списки, due → Calendar; soft-link Board; due-notify.\n\nЗаметка: [[Todo]] · API `/api/todo/`",
                'body' => <<<'MD'
# Todo

Claimant `todo` · `server/src/Todo/` · `client/src/features/todo/` · app `todo`

**Доступ:** app — любой `ROLE_USER` (`canUseTodo()`); не `ProtectedAppModules`. ACL — owner/share на списках.

## Назначение

Списки, пункты, markdown-заметки, sharing по email.

## Мосты

| Связь | Поля / поведение |
|-------|------------------|
| [[Calendar]] overlay | `due_at` |
| [[Board]] soft-link | `board_card_id` на пункте |
| Shell notify | due-notify watcher (`DueNotifyWatcher`) |

## Приложения

| ID | Назначение |
|----|------------|
| `todo` | списки и пункты |
| `habits` | трекер привычек (UI на Todo API, v1 без habit_log) |

Документы: `docs/todo/README.md`, `docs/habits/README.md`

← [[Home]] · [[Calendar]] · [[Board]] · [[Changelog]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Board',
                'notePath' => 'Notes/Apps/Board.md',
                'labels' => ['board'],
                'cardDescription' => "Kanban + soft-link PKB.\n\nЗаметка: [[Board]] · [[Changelog]] · API `/api/board/`",
                'body' => <<<'MD'
# Board

Claimant `board` · `ROLE_BOARD` · `requiredRole: board` · `server/src/Board/` · `client/src/features/board/` · app `board`

## Назначение

Workspaces → boards → lists → cards. DnD, чеклисты, комментарии, вложения, фильтры, activity, labels.

## Связь с [[PKB]]

На карточке: `pkb_vault_id` + `pkb_note_path`. UI: привязка / создание `Board/{boardId}/{cardId}.md`, invite readers. Обратно: `GET /api/board/cards/linked?vault_id=&path=`.

Deep-link окна Board: props `boardId`, `cardId`.

DX: PHPUnit `BoardManagerTest::testPkbNoteLinkSerializeAndLinkedLookup`; см. [[Board]]↔[[PKB]].

Эта доска «XOS — roadmap» связана с vault `slug=xos`. Журнал сдач: [[Changelog]].

Realtime: SSE `GET /boards/{id}/events`; optional Mercure (`MERCURE_URL`+`MERCURE_JWT_SECRET`, `GET …/realtime`); polling fallback. Conflict: `expected_updated_at` → 409.

Также: `GET /boards/{id}/changes`, `GET /search`.

Документы: `docs/board/README.md`, `TZ.md` · журнал: [[Changelog]]

## Приложения

`board`

← [[Home]] · [[PKB]] · [[Calendar]] · [[Changelog]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'PKB',
                'notePath' => 'Notes/Apps/PKB.md',
                'labels' => ['pkb'],
                'cardDescription' => "База знаний (vaults) + deep-link.\n\nЗаметка: [[PKB]] · [[Changelog]] · API `/api/pkb/`",
                'body' => <<<'MD'
# PKB

Claimant `pkb` · `ROLE_PKB` · `requiredRole: pkb` · `server/src/Pkb/` · `client/src/features/pkb/` · app `pkb`

## Назначение

Vault = папка [[Explorer]] + индекс в БД. Wikilinks `[[Note]]`, backlinks, graph, search, sharing.

Этот vault **XOS** (`slug=xos`) — проектная документация: [[Home]], [[Architecture]], [[AppsCatalog]], [[Changelog]], модули в `Notes/Apps/`.

Deep-link окна PKB: props `vaultId`, `notePath`. Связанные карточки [[Board]]: `GET /api/board/cards/linked`.

Фичи: FULLTEXT; ambiguous wikilink; `encrypt_at_rest`; plugins; ZIP export; `remote_sync_url` + `POST /vaults/{id}/remote-sync`.

Документация в vault обновляется через seed: `php bin/console xos:seed-project --force`.

Документы: `docs/pkb/README.md`, `TZ.md`

## Приложения

`pkb`

← [[Home]] · [[Board]] · [[Explorer]] · [[Changelog]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'System',
                'notePath' => 'Notes/Apps/System.md',
                'labels' => ['system'],
                'cardDescription' => "Settings, shell layout, browser, games, widgets.\n\nЗаметка: [[System]]",
                'body' => <<<'MD'
# System

Системные и развлекательные приложения без отдельного Symfony-claimant (кроме общих ролей).

## Приложения (app id)

| ID | Название |
|----|----------|
| `settings` | Settings (тема, desktop-state, mobile) |
| `shell-settings` | Макет оболочки (панель / меню) |
| `browser` | Браузер (`/api/browser/proxy`) |
| `chess` | Шахматы |
| `tic-tac-toe` | Крестики-нолики |
| `sudoku` | Судоку |
| `minesweeper` | Сапёр |
| `solitaire` | Косынка |
| `game-2048` | 2048 |
| `memory` | Memory |
| `snake` | Змейка |
| `sticky-note` | Стикер (multi) |
| `widget-clock` | Часы (desktop widget) |
| `widget-weather` | Погода (desktop widget) |
| `widget-reminders` | Напоминания (лента + local reminders) |
| `demo-calculator` | Calculator (демо) |

## Виджеты на столе

- `shellRole: widget` — компактный chrome, без taskbar, z-tier ниже окон
- USER `desktop.widgets` — add/remove (ПКМ по столу / shell-settings)
- Prefs в `user_app_data`: `widget.clock`, `widget.weather`, `widget.reminders`

PWA: vite-plugin-pwa (shell + SW); NetworkFirst GET `/api/*`; offline banner + write outbox — **DONE**.

Документы: `docs/system/README.md`, `docs/APPS.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Content',
                'notePath' => 'Notes/Apps/Content.md',
                'labels' => ['iblock', 'content'],
                'cardDescription' => "IBlock consumers: notes, articles, FAQ, gallery, events…\n\nЗаметка: [[Content]] · factory `features/iblock-content`",
                'body' => <<<'MD'
# Content (IBlock consumers)

Каталоги поверх type `content` (seed `xos:seed-project`). Shared UI: `client/src/features/iblock-content` (`ContentCatalog*`).

Claimant в основном `iblock`; рецепты — `recipe` (`ROLE_RECIPE`).

## Приложения

| ID | Block / примечание |
|----|--------------------|
| `notes` / `note` | notes |
| `notebooks` | sections CRUD |
| `articles` / `article` | articles |
| `faqs` / `faq` | faqs |
| `galleries` / `gallery` | galleries |
| `announcements` / `announcement` | block `events` |
| `contacts` / `contact` | contacts |
| `services` / `service` | services |
| `ideas` / `idea` | ideas |
| `leads` / `lead` | CRM-мини (block `leads`) |
| `recipes` / `recipe` / `recipe-categories` | `ROLE_RECIPE` + `can_category`; share read-only |

## Ключевое

- Hub инфоблоков: [[IBlock]]
- Теги / избранное в ContentCatalog — **DONE**
- Документы: `docs/iblock/README.md`, `docs/APPS.md`

← [[Home]] · [[IBlock]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Assets',
                'notePath' => 'Notes/Apps/Assets.md',
                'labels' => ['assets'],
                'cardDescription' => "Склад, автопарк, контрагенты, договоры, помещения, ПО.\n\nЗаметка: [[Assets]] · API `/api/assets/`",
                'body' => <<<'MD'
# Assets

Claimant `assets` · `ROLE_ASSETS` · `server/src/Assets/` · `client/src/features/assets/` · apps `assets-*`

## Назначение

CRUD-справочники: склад, автопарк, контрагенты, договоры, помещения, ПО. Shared UI `AssetsCatalog*`.

## Приложения

| ID | Scope |
|----|-------|
| `assets-warehouse` / `assets-warehouse-item` | warehouse |
| `assets-fleet` / `assets-fleet-vehicle` | fleet |
| `assets-parties` / `assets-party` | party |
| `assets-contracts` / `assets-contract` | contract |
| `assets-rooms` / `assets-room` | room |
| `assets-software` / `assets-software-item` | software |

## API

Prefix `/api/assets/*`. Claimants: `assets.warehouse`, `assets.fleet`, …

Multi-OU: nullable `ou_id` на каталогах; list/create через `OuScope`.

Документы: `docs/APPS.md` § Assets

← [[Home]] · [[AppsCatalog]] · [[Changelog]]
MD,
            ],
            [
                'title' => 'TeamStorm',
                'notePath' => 'Notes/Apps/TeamStorm.md',
                'labels' => ['system'],
                'cardDescription' => "TeamStorm proxy (URL + PrivateToken).\n\nЗаметка: [[TeamStorm]] · API `/api/ts/`",
                'body' => <<<'MD'
# TeamStorm

Claimant `ts` · `ROLE_TS` · `server/src/Ts/` · app `teamstorm`

## Назначение

Прокси к TeamStorm: connection URL + PrivateToken (шифрование `TS_TOKEN_SECRET`).

## Приложения

`teamstorm`

Документы: `docs/ts/README.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'GitHub',
                'notePath' => 'Notes/Apps/GitHub.md',
                'labels' => ['github'],
                'cardDescription' => "GitHub Issues proxy (PAT).\n\nЗаметка: [[GitHub]] · API `/api/github/`",
                'body' => <<<'MD'
# GitHub

Claimant `github` · `ROLE_GITHUB` · `server/src/Github/` · app `github`

## Назначение

Personal Access Token → proxy Issues (list / detail / patch).

## Приложения

`github`

## API

- `GET/PUT/DELETE /api/github/credentials`
- `GET /api/github/issues`
- `GET/PATCH /api/github/repos/{owner}/{repo}/issues/{number}`

At rest: `GITHUB_TOKEN_SECRET`. Документы: `docs/github/README.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Inbox',
                'notePath' => 'Notes/Apps/Inbox.md',
                'labels' => ['inbox'],
                'cardDescription' => "Внутренние сообщения User→User.\n\nЗаметка: [[Inbox]] · API `/api/inbox/`",
                'body' => <<<'MD'
# Inbox

Claimant `inbox` · `ROLE_INBOX` · `server/src/Inbox/` · apps `inbox`, `inbox-message`

## Назначение

Мини-почта внутри XOS (не IMAP). Список входящих/исходящих, карточка сообщения.

## Приложения

| ID | Тип |
|----|-----|
| `inbox` | regular |
| `inbox-message` | sub-app |

Документы: `docs/inbox/README.md` · бэклог IMAP: [[AppIdeas]]

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Habits',
                'notePath' => 'Notes/Apps/Habits.md',
                'labels' => ['todo'],
                'cardDescription' => "Трекер привычек на Todo.\n\nЗаметка: [[Habits]] · см. [[Todo]]",
                'body' => <<<'MD'
# Habits

App `habits` · UI поверх [[Todo]] API (отдельного backend-модуля нет).

## Назначение

Ежедневные/повторяющиеся привычки. v1 без сущности `habit_log`.

## Приложения

`habits`

Документы: `docs/habits/README.md`

← [[Home]] · [[Todo]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'IBlock',
                'notePath' => 'Notes/Apps/IBlock.md',
                'labels' => ['iblock'],
                'cardDescription' => "Инфоблоки Bitrix-like: API, managers, desktop apps.\n\nHub: [[IBlock]] · Fields/API/Sections/Properties/Frontend\n\ndocs/iblock/README.md",
                'body' => <<<'MD'
# IBlock

Claimant `iblock` · `ROLE_IBLOCK` · `server/src/IBlock/` · `client/src/features/iblock/` · apps `iblock-*`

Ориентиры Bitrix: [поля таблиц](https://dev.1c-bitrix.ru/api_help/iblock/fields.php), [D7 API](https://dev.1c-bitrix.ru/api_help/iblock/iblock_d7.php).

## Назначение

Универсальные инфоблоки: Type → Block → Section / Element / Property → PROPERTY_VALUES. Сервер переиспользуемый (managers без UI).

Consumers: [[Content]].

## Карта заметок

- [[IBlock Fields]] — Bitrix → XOS поля и unique
- [[IBlock API]] — REST + list filters
- [[IBlock Sections]] — M:N, `section_mode`, `element_filter`
- [[IBlock Properties]] — S/N/F/L/E/G
- [[IBlock Frontend]] — desktop apps и фильтры списков

## Быстрый старт

```bash
php bin/console doctrine:migrations:migrate
php bin/console main:claimant:sync
# демо PKB+Board:
php bin/console xos:seed-project --force
```

Prefix API: `/api/iblock/`.

## Документы в репо

`docs/iblock/README.md` · `TZ.md` · `docs/APPS.md`

## Вне scope (как в Bitrix, но не в XOS)

Facet `PROPERTY_INDEX`, LEFT/RIGHT_MARGIN, RSS, workflow, права раздела, полный SECTION_CHOOSER.

← [[Home]] · [[Architecture]] · [[AppsCatalog]] · [[Changelog]] · [[Content]]
MD,
            ],
        ];
    }

    /** @return array<string, string> */
    private function vaultNotes(): array
    {
        $notes = [
            'Notes/Home.md' => <<<'MD'
# XOS

Веб-CRM с desktop-окружением в браузере: окна, меню «Пуск», JWT API.

## Стек

- Backend: Symfony 7, Doctrine, MySQL — `server/`
- Frontend: React 19, Vite, Mantine, Zustand, TanStack Query — `client/`
- Auth: JWT + claimants / scopes (`setting.json`, `ProtectedAppModules`)

## Карта модулей

- [[Main]] — администрирование (+ audit)
- [[Device]] — учёт оборудования
- [[Explorer]] — файлы и viewers
- [[SchoolTask]] — расписание
- [[IncCom]] — финансы
- [[Calendar]] — календарь
- [[Todo]] — списки / due / Board-link
- [[Board]] — канбан
- [[PKB]] — база знаний
- [[System]] — settings, shell, games, widgets, PWA
- [[IBlock]] — инфоблоки (API + apps)
- [[Content]] — IBlock consumers (notes…recipes)
- [[Assets]] — склад / автопарк / договоры…
- [[TeamStorm]] — TeamStorm proxy
- [[GitHub]] — Issues
- [[Inbox]] — внутренние сообщения
- [[Habits]] — привычки (на Todo)

## Обзорные заметки

- [[Architecture]] — слои monorepo
- [[AppsCatalog]] — реестр всех приложений
- [[AppIdeas]] — открытый бэклог
- [[Changelog]] — журнал сдач

## Документы в репозитории

Индекс: `docs/README.md` · каталог: `docs/APPS.md` · идеи: `docs/APP_IDEAS.md`

Seed: `php bin/console xos:seed-project [--login=] [--force]`
MD,
            'Notes/Changelog.md' => <<<'MD'
# Changelog

Краткий журнал сдач в демо Board↔PKB. Полные ТЗ — в `docs/`.

## Волна 1 — IncCom + DX (DONE)

### IncCom: позиции из чека

- Парсинг FNS JSON → `TransactionItem`; `fill_items` / `apply-items`
- At rest: `INCCOM_FNS_SECRET` → AES-256-GCM (`enc:v1:`)

### Board ↔ PKB DX

- `pkb_vault_id` / `pkb_note_path`; `GET /api/board/cards/linked`; deep-link

См. [[IncCom]], [[Board]], [[PKB]].

## IBlock — developer docs (DONE)

Vault: [[IBlock]] + Fields/API/Sections/Properties/Frontend. Обзор: `docs/iblock/README.md`.

## Волна 2 — SchoolTask Critical + Explorer dirty-close (DONE)

SchoolTask B1–B3/F1–F3; Explorer dirty-close + taskbar `getWindowApi().close()`.

См. [[SchoolTask]], [[Explorer]].

## Волна 3 — Board polling + search (partial)

Polling `…/changes` + `/api/board/search` — **DONE**.

## W3b + Platform+ (DONE)

- [[Board]]: SSE `/boards/{id}/events` + optional Mercure (`MERCURE_URL`+`MERCURE_JWT_SECRET`, `/realtime`) + conflict UI
- [[PKB]]: FULLTEXT; encrypt_at_rest; plugins; ZIP export; `remote_sync_url` + POST `/remote-sync`
- Multi-OU: Main users/groups; Device via `createdBy.ou`; Assets `ou_id`
- PWA: NetworkFirst GET `/api/*` + offline banner + write outbox

Остаток: Board email/Trello; PKB co-edit; IMAP/Open Banking — [[AppIdeas]]

## Content + Assets + bridges + platform (DONE)

- [[Content]]: articles, FAQ, gallery, events, contacts, services, ideas, notebooks (+ notes/recipes)
- [[Assets]]: warehouse, fleet, parties, contracts, rooms, software — `/api/assets/*`
- Bridges: [[Todo]]↔[[Board]] (`board_card_id`); due-notify; Device↔[[IncCom]] (`deviceId`)
- Platform: PWA shell; `shell-settings`; `main-audit`; OU list filter
- [[Explorer]] viewers; [[System]] games/widgets

См. [[AppsCatalog]], `docs/APPS.md`.

## Apps wave (DONE)

[[SchoolTask]] homeworks + parent share · [[Content]] leads · [[GitHub]] · [[Habits]] · [[Inbox]] · IncCom bank UI · tags/favorites.

## Далее

- IMAP / Open Banking; Board email/Trello — [[AppIdeas]]

← [[Home]] · [[AppsCatalog]] · [[AppIdeas]]
MD,
            'Notes/AppIdeas.md' => <<<'MD'
# App Ideas

Открытый бэклог. Не ТЗ. Каталог сделанного: [[AppsCatalog]] · `docs/APPS.md`.

Полный текст в репо: `docs/APP_IDEAS.md`.

## Бэклог

| Идея | Заметки |
|------|---------|
| IMAP/SMTP inbox | поверх [[Inbox]] |
| Open Banking / CSV | импорт в [[IncCom]] |
| Plugin marketplace | каталог плагинов [[PKB]] |
| Co-editing PKB | совместное редактирование |
| Trello import | импорт в [[Board]] |
| Board email notify | уведомления по карточкам |

## Уже сделано

Homework + parent share · IncCom bank UI · CRM leads · [[GitHub]] · [[Habits]] · [[Inbox]] · tags/favorites · Board SSE/Mercure · PKB encrypt/plugins/ZIP/remote sync · Multi-OU · PWA outbox.

```bash
php bin/console xos:seed-project
```

← [[Home]] · [[AppsCatalog]] · [[Changelog]]
MD,
            'Notes/Architecture.md' => <<<'MD'
# Architecture

Монорепозиторий: Symfony 7 (API) + React 19 (desktop-shell).

## Слои backend (`server/src/`)

| Модуль | Путь | Назначение |
|--------|------|------------|
| App | `App/` | Kernel, JWT, HTTP-утилиты |
| Main | `Main/` | Пользователи, OU, claimants, audit |
| Device | `Device/` | Оборудование |
| IBlock | `IBlock/` | Инфоблоки |
| Assets | `Assets/` | Склад / автопарк / … |
| IncCom | `IncCom/` | Доходы/расходы |
| SchoolTask | `SchoolTask/` | Расписание |
| Explorer | `Explorer/` | Файлы |
| Calendar | `Calendar/` | Календари |
| Todo | `Todo/` | Списки |
| Board | `Board/` | Kanban |
| Pkb | `Pkb/` | Vaults |
| Ts | `Ts/` | TeamStorm proxy |
| Github | `Github/` | Issues proxy |
| Inbox | `Inbox/` | Внутренние сообщения |

## Клиент

- `client/src/apps/*` — манифесты окон (120+)
- `client/src/features/*` — доменная логика (`iblock-content`, `assets`, `github`, `inbox`, …)
- `client/src/core/*` — auth, API, offline outbox, window manager, theme

## Безопасность API

- JWT: `/api/login`, refresh, logout
- `#[Access]` + scopes; загрузки через `UploadPathResolver`
- Защищённые модули: `ProtectedAppModules`

## Пагинация и ошибки

- Legacy: `limit` / `offset` + `Content-Range`
- 400: `{ message, violations }`

Связано: [[Home]], [[AppsCatalog]], [[Board]], [[PKB]], [[Assets]], [[Content]]

См. также `docs/APPS.md`, `docs/README.md`
MD,
            'Notes/AppsCatalog.md' => <<<'MD'
# Apps Catalog

Реестр приложений XOS (см. `docs/APPS.md`). Источник правды по app id: `client/src/apps/*/index.ts`.

## Как устроены приложения

| Слой | Путь |
|------|------|
| Манифест | `client/src/apps/<id>/index.ts` |
| UI | `client/src/apps/<id>/*.tsx` |
| Фичи | `client/src/features/<domain>/` |
| API client | `client/src/core/api/endpoints/*Api.ts` |
| Backend | `server/src/<Module>/` |

Типы: **regular** · **sub-app** · **picker** · **utility**.

## Домены

| Домен | Claimant | Apps (id) |
|-------|----------|-----------|
| System | — | settings, shell-settings, browser, games, sticky-note, **widget-clock/weather/reminders**, demo-calculator |
| Main | main | main-users, main-user, main-groups, main-group, main-ous, main-ou, main-claimants, main-claimant, main-audit |
| Device | device | device-devices…device-license-key (17) |
| Explorer | explorer | explorer + pickers + notepad/markdown/code/pdf/office/diff/map/image/archiver/video/audio (14) |
| SchoolTask | schooltask | subjects/classes/calendars/teacher + **homeworks** (9) |
| IncCom | inccom | inccom |
| Calendar | calendar | calendar |
| Todo | todo | todo |
| Habits | todo | habits |
| Board | board | board |
| PKB | pkb | pkb |
| TeamStorm | ts | teamstorm |
| GitHub | github | github |
| Inbox | inbox | inbox, inbox-message |
| IBlock | iblock | iblock-types…iblock-property (10) |
| Content | iblock / recipe | notes, notebooks, articles, faqs, galleries, announcements, contacts, services, ideas, **leads**, recipes (+ categories) |
| Assets | assets | warehouse/fleet/parties/contracts/rooms/software × list+detail (12) |

## Модули в vault

[[Main]] · [[Device]] · [[Explorer]] · [[SchoolTask]] · [[IncCom]] · [[Calendar]] · [[Todo]] · [[Habits]] · [[Board]] · [[PKB]] · [[System]] · [[IBlock]] · [[Content]] · [[Assets]] · [[TeamStorm]] · [[GitHub]] · [[Inbox]]

Полный каталог: `docs/APPS.md` · идеи: [[AppIdeas]]

← [[Home]] · [[Architecture]] · [[Changelog]]
MD,
            'Notes/Apps/IBlock/Fields.md' => <<<'MD'
# IBlock Fields

Соответствие [Bitrix fields](https://dev.1c-bitrix.ru/api_help/iblock/fields.php) → XOS.

## Таблицы

| Bitrix | XOS | Unique / ключ |
|--------|-----|----------------|
| `b_iblock_type` | `iblock_type` | `code` global |
| `b_iblock` | `iblock_block` | `(type_id, code)` |
| `b_iblock_section` | `iblock_section` | `(block_id, code)` |
| `b_iblock_element` | `iblock_element` | `(block_id, code)` |
| `b_iblock_section_element` | `iblock_section_element` | `(section_id, element_id, additional_property_id)` |
| `b_iblock_property` | `iblock_property` | `(block_id, code)` — только Block |
| `b_iblock_property_enum` | `iblock_property_enum` | `(property_id, code)` |
| значения | `iblock_element_property` (+ enum M2M) | typed S/N/F/L/E/G |
| `b_iblock_section_property` | `iblock_section_property` | `(section_id, property_id)` |

## Поля элемента (часто используемые)

| Bitrix | XOS |
|--------|-----|
| `ID` | `id` |
| `IBLOCK_ID` | `block_id` |
| `IBLOCK_SECTION_ID` | `section_id` (primary) |
| `IBLOCK_SECTION` | `section_ids[]` |
| `NAME` / `CODE` / `ACTIVE` / `SORT` | одноименные |
| `PREVIEW_TEXT` / `DETAIL_TEXT` | `preview_text` / `detail_text` |
| `PROPERTY_*` | `PROPERTY_VALUES` + фильтр `PROPERTY_{CODE}` |

## Block extras

- `sections`, `property` — флаги возможностей
- `section_mode` — `bind` \| `tree` \| `filter` \| `bind_filter`

Обзор: `docs/iblock/README.md`

← [[IBlock]] · [[IBlock Sections]] · [[IBlock Properties]]
MD,
            'Notes/Apps/IBlock/API.md' => <<<'MD'
# IBlock API

Prefix `/api/iblock/`. JWT + `#[Access('iblock.*')]`.

Стиль managers как Bitrix D7: `getById` / `getList` / `add` / `update` / `delete`.

## Ресурсы

| Path | Claimant | Особое |
|------|----------|--------|
| `/type` | `iblock.type` | CRUD |
| `/block` | `iblock.block` | `section_mode`, filter `type_id` |
| `/section` | `iblock.section` | `GET /{id}/filter`, `POST /{id}/elements` |
| `/section-property` | `iblock.section` | smart filter |
| `/element` | `iblock.element` | `PROPERTY_VALUES`, `section_ids` |
| `/property` | `iblock.property` | `field_type`, `link_iblock_id` |
| `/property-enum` | `iblock.property` | |

## List

```json
{
  "t": "list",
  "limit": 50,
  "offset": 1,
  "sortBy": [{ "key": "sort", "order": "ASC" }],
  "filters": { "block_id": 1, "PROPERTY_COLOR": "blue" }
}
```

`t: "select"` → `[{value,label}]`. Ответ + `Content-Range`.

## Element write

```json
{
  "code": "item_1",
  "name": "Item",
  "block_id": 1,
  "section_ids": [10, 11],
  "PROPERTY_VALUES": { "COLOR": "RED", "DOC": 42 }
}
```

Алиасы: `properties`; разделы: `sections` / `IBLOCK_SECTION`.

Детали: `docs/iblock/API.md`

← [[IBlock]] · [[IBlock Properties]] · [[IBlock Sections]]
MD,
            'Notes/Apps/IBlock/Sections.md' => <<<'MD'
# IBlock Sections

Аналог Bitrix `b_iblock_section` + `b_iblock_section_element`.

## M:N

Таблица `iblock_section_element`: `section_id`, `element_id`, `additional_property_id` (0 = обычная).

- `Element.section_id` — основной раздел
- `section_ids` — все обычные привязки; sync через `SectionElementManager`

## section_mode (на Block)

| Режим | Список по `section_id` |
|-------|------------------------|
| `bind` | только binds раздела |
| `tree` | binds раздела + потомков |
| `filter` | inherited `element_filter` |
| `bind_filter` | tree ∪ filter |

## element_filter

JSON на Section. Наследование **root → leaf**, при конфликте ключа побеждает дочерний.

В detail API: `element_filter` + `inherited_element_filter`.

`POST /api/iblock/section/{id}/elements` — list с учётом mode.

`GET …/section/{id}/filter` — smart UI (section-property), без смены семантики.

Код: `SectionElementManager`, `ElementManager::applySectionModeConstraint`.

← [[IBlock]] · [[IBlock Fields]] · [[IBlock API]]
MD,
            'Notes/Apps/IBlock/Properties.md' => <<<'MD'
# IBlock Properties

Property принадлежит **Block** (`block_id` required). Связи с Type нет.

## field_type

| Код | Хранение | Заметки |
|-----|----------|---------|
| `S` | `value` / `value_s` | строка |
| `N` | `value_n` | число |
| `F` | `value_file_id` | upload `POST /api/main/file/upload` `module=iblock` |
| `L` | M2M `valueL` | enums `/property-enum` |
| `E` | `value_element_id` | **`link_iblock_id`** |
| `G` | `value_section_id` | **`link_iblock_id`** |

`multiple`: L — несколько enum в одной строке; иначе несколько строк значений.

## PROPERTY_VALUES

На create/update элемента: map `CODE → value|value[]`.  
Фильтр списка: `PROPERTY_{CODE}` (eq; `%` → LIKE).

Section-property (`iblock_section_property`) — настройки smart filter UI, не значения.

← [[IBlock]] · [[IBlock API]] · [[IBlock Frontend]]
MD,
            'Notes/Apps/IBlock/Frontend.md' => <<<'MD'
# IBlock Frontend

Start Menu «Инфоблоки» (`requiredRole: iblock`).

| List | Detail |
|------|--------|
| `iblock-types` | `iblock-type` |
| `iblock-blocks` | `iblock-block` (`section_mode`) |
| `iblock-sections` | `iblock-section` (`element_filter` + smart filter) |
| `iblock-elements` | `iblock-element` (MultiSelect разделов, PROPERTY_VALUES) |
| `iblock-properties` | `iblock-property` (+ enums) |

## Фильтры списков

Хук `useIblockTypeBlockFilter`:

- блоки — Select **тип** → `filters.type_id`
- элементы / разделы / свойства — **тип → инфоблок** → `filters.block_id`
- clearable; launch `blockId` подставляется

Детальные фильтры (раздел, свойства…) — в task-specific apps, не в общих списках.

Клиент: `iblockApi.ts`, `iblockAccess.ts`.

← [[IBlock]] · [[AppsCatalog]]
MD,
        ];

        foreach ($this->moduleCatalog() as $mod) {
            $notes[$mod['notePath']] = $mod['body'];
        }

        return $notes;
    }
}
