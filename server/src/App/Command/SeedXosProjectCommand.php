<?php

namespace App\Command;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\Card;
use Board\Entity\Label;
use Board\Entity\Workspace;
use Board\Repository\WorkspaceRepository;
use Board\Service\BoardManager;
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

        $io->success([
            $vault ? sprintf('Vault «XOS» slug=%s id=%d', self::VAULT_SLUG, $vault->getId()) : 'Vault пропущен',
            $board ? sprintf('Доска «%s» id=%d', self::BOARD_TITLE, $board->getId()) : 'Доска пропущена',
        ]);

        return Command::SUCCESS;
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

Детали: [[Changelog]] · [[IncCom]] · `docs/inccom/README.md` · `docs/API_SPEC.md` § Board↔PKB.
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

Детали: [[Changelog]] · [[SchoolTask]] · [[Explorer]] · `docs/ROADMAP_WAVES.md` · `docs/schooltask/REVIEW.md`.
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
Сдано (slice): Board changes polling + global card search.

**W3b** backlog: Mercure/SSE; Trello import; email-уведомления.

См. `docs/ROADMAP_WAVES.md`, `docs/board/PLAN.md`, [[Board]], [[Changelog]].
MD, ['board', 'docs', 'mvp']);

        $card('W3b PKB: templates/graph, encryption, plugins', <<<'MD'
Backlog **W3b**: PKB templates/graph; encryption at-rest; plugins / co-editing.

См. [[PKB]], `docs/pkb/PLAN.md`, `docs/ROADMAP_WAVES.md`.
MD, ['pkb', 'v2']);

        $card('Документация приложений', <<<'MD'
Каталог `docs/APPS.md`, ТЗ по доменам, индекс `docs/README.md`. Связано с [[AppsCatalog]], [[Changelog]] и vault XOS.
MD, ['docs', 'mvp'], [
            'title' => 'Осталось',
            'items' => [
                'Сверять ТЗ с кодом при крупных фичах',
                'Сверять seed Board/PKB с `docs/` после крупных фич',
            ],
        ]);
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
                'description' => "Слои monorepo, auth, клиент/сервер.\n\nСм. [[Architecture]] и `docs/ARCHITECTURE.md`.",
            ],
            [
                'title' => 'Apps Catalog',
                'notePath' => 'Notes/AppsCatalog.md',
                'boardList' => 'Обзор',
                'labels' => ['docs'],
                'description' => "Реестр ~55 приложений и типов манифестов.\n\nСм. [[AppsCatalog]] и `docs/APPS.md`.",
            ],
            [
                'title' => 'Changelog',
                'notePath' => 'Notes/Changelog.md',
                'boardList' => 'Обзор',
                'labels' => ['docs', 'mvp'],
                'description' => "Недавние сдачи (Волна 1 IncCom+DX, Board↔PKB).\n\nСм. [[Changelog]].",
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

## Ключевое

- JWT scopes из `setting.json` + sync в БД: `php bin/console main:claimant:sync`
- UI прав: `access_options` в claimant после sync
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
- Документы: `docs/device/README.md`, `docs/device/TZ.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'Explorer',
                'notePath' => 'Notes/Apps/Explorer.md',
                'labels' => ['explorer'],
                'cardDescription' => "VFS, pickers, просмотрщики.\n\nЗаметка: [[Explorer]] · API `/api/explorer/`",
                'body' => <<<'MD'
# Explorer

Claimant `explorer` · `server/src/Explorer/` · `client/src/features/explorer/` · apps `explorer*`

## Назначение

Файловая система пользователя, Open/Save pickers, блокнот, markdown, изображения, архивы, медиа.

## Приложения (app id)

| ID | Примечание |
|----|------------|
| `explorer` | проводник, multi-instance |
| `explorer-open-picker` / `explorer-save-picker` | диалоги |
| `explorer-notepad` / `explorer-markdown-viewer` | редакторы |
| `explorer-image-viewer` / `explorer-archiver` | просмотр |
| `explorer-audio-player` / `explorer-video-player` | single-instance |

## Ключевое

- Persist: `WIN.documentPath`
- Долг: dirty-close notepad/markdown
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

`schooltask-subjects`, `schooltask-subject`, `schooltask-classes`, `schooltask-class`, `schooltask-calendars`, `schooltask-calendar`, `schooltask-calendar-editor`, `schooltask-calendar-teacher`

## Ключевое

- Backlog прав: `docs/schooltask/REVIEW.md`
- Документы: `docs/schooltask/README.md`, `TZ.md`

← [[Home]] · [[Calendar]]
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

## Ключевое

- API: `/api/IncCom/`
- Документы: `docs/inccom/README.md`, `TZ.md` · журнал: [[Changelog]]

← [[Home]] · [[AppsCatalog]] · [[Changelog]]
MD,
            ],
            [
                'title' => 'Calendar',
                'notePath' => 'Notes/Apps/Calendar.md',
                'labels' => ['calendar'],
                'cardDescription' => "Личные календари + overlay.\n\nЗаметка: [[Calendar]] · API `/api/calendar/`",
                'body' => <<<'MD'
# Calendar

Claimant `calendar` · `server/src/Calendar/` · app `calendar`

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
                'cardDescription' => "Списки и заметки.\n\nЗаметка: [[Todo]] · API `/api/todo/`",
                'body' => <<<'MD'
# Todo

Claimant `todo` · `server/src/Todo/` · `client/src/features/todo/` · app `todo`

## Назначение

Списки, пункты, markdown-заметки, sharing по email. Due → overlay в [[Calendar]].

## Приложения

`todo`

← [[Home]] · [[Calendar]]
MD,
            ],
            [
                'title' => 'Board',
                'notePath' => 'Notes/Apps/Board.md',
                'labels' => ['board'],
                'cardDescription' => "Kanban + soft-link PKB.\n\nЗаметка: [[Board]] · [[Changelog]] · API `/api/board/`",
                'body' => <<<'MD'
# Board

Claimant `board` · `server/src/Board/` · `client/src/features/board/` · app `board`

## Назначение

Workspaces → boards → lists → cards. DnD, чеклисты, комментарии, вложения, фильтры, activity, labels.

## Связь с [[PKB]]

На карточке: `pkb_vault_id` + `pkb_note_path`. UI: привязка / создание `Board/{boardId}/{cardId}.md`, invite readers. Обратно: `GET /api/board/cards/linked?vault_id=&path=`.

Deep-link окна Board: props `boardId`, `cardId`.

DX: `docs/API_SPEC.md` § Board↔PKB; PHPUnit `BoardManagerTest::testPkbNoteLinkSerializeAndLinkedLookup`.

Эта доска «XOS — roadmap» связана с vault `slug=xos`. Журнал сдач: [[Changelog]].

W3: polling `GET /boards/{id}/changes`, search `GET /search` — см. [[Changelog]].

## Приложения

`board`

← [[Home]] · [[PKB]] · [[Calendar]] · [[Changelog]]
MD,
            ],
            [
                'title' => 'PKB',
                'notePath' => 'Notes/Apps/PKB.md',
                'labels' => ['pkb'],
                'cardDescription' => "База знаний (vaults) + deep-link.\n\nЗаметка: [[PKB]] · [[Changelog]] · API `/api/pkb/`",
                'body' => <<<'MD'
# PKB

Claimant `pkb` · `server/src/Pkb/` · `client/src/features/pkb/` · app `pkb`

## Назначение

Vault = папка [[Explorer]] + индекс в БД. Wikilinks `[[Note]]`, backlinks, graph, search, sharing.

Этот vault **XOS** (`slug=xos`) — проектная документация: [[Home]], [[Architecture]], [[AppsCatalog]], [[Changelog]], модули в `Notes/Apps/`.

Deep-link окна PKB: props `vaultId`, `notePath`. Связанные карточки [[Board]]: `GET /api/board/cards/linked`.

Документация в vault обновляется через seed: `php bin/console xos:seed-project --force` (локаль; см. `docs/DEVELOPER_GUIDE.md`).

## Приложения

`pkb`

← [[Home]] · [[Board]] · [[Explorer]] · [[Changelog]]
MD,
            ],
            [
                'title' => 'System',
                'notePath' => 'Notes/Apps/System.md',
                'labels' => ['system'],
                'cardDescription' => "Settings, browser, игры.\n\nЗаметка: [[System]]",
                'body' => <<<'MD'
# System

Системные и развлекательные приложения без отдельного Symfony-claimant (кроме общих ролей).

## Приложения (app id)

| ID | Название |
|----|----------|
| `settings` | Settings (тема, desktop-state) |
| `browser` | Браузер (`/api/browser/proxy`) |
| `chess` | Шахматы |
| `tic-tac-toe` | Крестики-нолики |
| `sudoku` | Судоку |
| `minesweeper` | Сапёр |
| `solitaire` | Косынка |
| `demo-calculator` | Calculator (демо) |

Документы: `docs/system/README.md`, `TZ.md`

← [[Home]] · [[AppsCatalog]]
MD,
            ],
            [
                'title' => 'IBlock',
                'notePath' => 'Notes/Apps/IBlock.md',
                'labels' => ['iblock'],
                'cardDescription' => "Инфоблоки Bitrix-like: API, managers, desktop apps.\n\nHub: [[IBlock]] · [[IBlock Fields]] · [[IBlock API]] · [[IBlock Sections]] · [[IBlock Properties]] · [[IBlock Frontend]]\n\ndocs/iblock/DEVELOPER_GUIDE.md",
                'body' => <<<'MD'
# IBlock

Claimant `iblock` · `ROLE_IBLOCK` · `server/src/IBlock/` · `client/src/features/iblock/` · apps `iblock-*`

Ориентиры Bitrix: [поля таблиц](https://dev.1c-bitrix.ru/api_help/iblock/fields.php), [D7 API](https://dev.1c-bitrix.ru/api_help/iblock/iblock_d7.php).

## Назначение

Универсальные инфоблоки: Type → Block → Section / Element / Property → PROPERTY_VALUES. Сервер переиспользуемый (managers без UI).

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

`docs/iblock/DEVELOPER_GUIDE.md` · `API.md` · `README.md` · `TZ.md` · `docs/DATABASE_SCHEMA.md`

## Вне scope (как в Bitrix, но не в XOS)

Facet `PROPERTY_INDEX`, LEFT/RIGHT_MARGIN, RSS, workflow, права раздела, полный SECTION_CHOOSER.

← [[Home]] · [[Architecture]] · [[AppsCatalog]] · [[Changelog]]
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

- [[Main]] — администрирование
- [[Device]] — учёт оборудования
- [[Explorer]] — файлы
- [[SchoolTask]] — расписание
- [[IncCom]] — финансы
- [[Calendar]] — календарь
- [[Todo]] — заметки
- [[Board]] — канбан
- [[PKB]] — база знаний
- [[System]] — settings, browser, игры
- [[IBlock]] — инфоблоки (API)

## Обзорные заметки

- [[Architecture]] — слои monorepo
- [[AppsCatalog]] — реестр приложений
- [[Changelog]] — недавние сдачи (Волна 1 и др.)

## Документы в репозитории

Индекс: `docs/README.md` · каталог: `docs/APPS.md` · архитектура: `docs/ARCHITECTURE.md`

Seed: `php bin/console xos:seed-project [--login=] [--force]`
MD,
            'Notes/Changelog.md' => <<<'MD'
# Changelog

Краткий журнал сдач в демо Board↔PKB. Полные ТЗ — в `docs/`.

## Волна 1 — IncCom + DX (DONE)

### IncCom: позиции из чека

- Парсинг FNS JSON → `TransactionItem` (product по имени, qty/price, пересчёт `amount`, `isManualAmount=false`)
- `POST …/receipt/fetch` с `fill_items=true` (body или query)
- `POST …/receipt/apply-items` для уже сохранённого `receipt_json`
- UI: «Заполнить позиции из чека» после загрузки чека

См. [[IncCom]], `docs/inccom/README.md`.

### Шифрование FNS `master_token`

- Env `INCCOM_FNS_SECRET` → AES-256-GCM, префикс `enc:v1:`
- Encrypt на PUT credentials; decrypt только в `FnsReceiptService`
- Legacy plaintext читается; следующий PUT перешифровывает

### Board ↔ PKB DX

- Поля карточки `pkb_vault_id`, `pkb_note_path`; `GET /api/board/cards/linked`
- Deep-link: Board `boardId`/`cardId`, PKB `vaultId`/`notePath`
- `docs/API_SPEC.md` § Board↔PKB; PHPUnit linked/serialize
- Seed локали: `xos:seed-project --force` (не на prod) — `docs/DEVELOPER_GUIDE.md`

См. [[Board]], [[PKB]].

## IBlock — developer docs (PKB + Board)

- Guide: `docs/iblock/DEVELOPER_GUIDE.md` (Bitrix fields/D7 mapping)
- Vault: [[IBlock]], [[IBlock Fields]], [[IBlock API]], [[IBlock Sections]], [[IBlock Properties]], [[IBlock Frontend]]
- Доска XOS: карточки модуля + подкарточки Fields/API/Sections/Properties/Frontend
- Seed: `php bin/console xos:seed-project --force`

## Волна 2 — SchoolTask Critical + Explorer dirty-close (DONE)

### SchoolTask

- B1/B2: тьютор **или** scopes/ROOT; create/update/delete; class show/update `checkScopes: false`
- B3: `GET /api/schooltask/files/{id}/download`; `/uploads/task/` запрещён
- F1/F2: `user_ids` + FormData без forced Content-Type
- F3: launch `schooltask-calendar-editor` из классов/календарей

См. [[SchoolTask]], `docs/schooltask/REVIEW.md`, `docs/ROADMAP_WAVES.md`.

### Explorer

- Dirty-close notepad/markdown: save / discard / cancel
- Taskbar close → `getWindowApi().close()` (не обход confirm)

См. [[Explorer]], `docs/explorer/TODO.md`.

## Волна 3 — Board polling + search (partial)

- Board changes polling (`…/changes?since=`) + global search (`/api/board/search`) — **DONE**
- **W3b** backlog: Mercure/SSE; PKB templates/graph (encryption/plugins)

См. `docs/ROADMAP_WAVES.md`, [[Board]], [[PKB]].

## Далее (Roadmap)

- **W3b**: Mercure/SSE; PKB templates/graph/encryption/plugins — `docs/ROADMAP_WAVES.md`
- SchoolTask High/Medium — [[SchoolTask]]
- Волна 4–5: bridges, PWA/offline — backlog

← [[Home]] · [[IncCom]] · [[Board]] · [[PKB]]
MD,
            'Notes/Architecture.md' => <<<'MD'
# Architecture

Монорепозиторий: Symfony 7 (API) + React 19 (desktop-shell).

## Слои backend (`server/src/`)

| Модуль | Путь | Назначение |
|--------|------|------------|
| App | `App/` | Kernel, JWT, HTTP-утилиты |
| Main | `Main/` | Пользователи, OU, claimants |
| Device | `Device/` | Оборудование |
| IBlock | `IBlock/` | Инфоблоки |
| IncCom | `IncCom/` | Доходы/расходы |
| SchoolTask | `SchoolTask/` | Расписание |
| Explorer | `Explorer/` | Файлы |
| Calendar | `Calendar/` | Календари |
| Todo | `Todo/` | Заметки |
| Board | `Board/` | Kanban |
| Pkb | `Pkb/` | Vaults |

## Клиент

- `client/src/apps/*` — манифесты окон (~55+)
- `client/src/features/*` — доменная логика
- `client/src/core/*` — auth, API, window manager, theme

## Безопасность API

- JWT: `/api/login`, refresh, logout
- `#[Access]` + scopes; загрузки через `UploadPathResolver`
- Защищённые модули: `ProtectedAppModules`

## Пагинация и ошибки

- Legacy: `limit` / `offset` + `Content-Range`
- 400: `{ message, violations }`

Связано: [[Home]], [[AppsCatalog]], [[Board]], [[PKB]]

Полный текст: `docs/ARCHITECTURE.md`
MD,
            'Notes/AppsCatalog.md' => <<<'MD'
# Apps Catalog

Реестр приложений XOS (см. `docs/APPS.md`).

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

| Домен | Claimant | Apps (порядок) |
|-------|----------|----------------|
| System | — | settings, browser, games, demo-calculator |
| Main | main | 8 (users/groups/ous/claimants) |
| Device | device | 17 |
| Explorer | explorer | 9 |
| SchoolTask | schooltask | 8 |
| IncCom | inccom | 1 |
| Calendar | calendar | 1 |
| Todo | todo | 1 |
| Board | board | 1 |
| PKB | pkb | 1 |
| IBlock | iblock | 10 (types/blocks/sections/elements/properties + details) |

Детали по модулям: [[Main]], [[Device]], [[Explorer]], [[SchoolTask]], [[IncCom]], [[Calendar]], [[Todo]], [[Board]], [[PKB]], [[System]], [[IBlock]]

← [[Home]] · [[Architecture]]
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

Полный guide: `docs/iblock/DEVELOPER_GUIDE.md` · schema: `docs/DATABASE_SCHEMA.md`

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
