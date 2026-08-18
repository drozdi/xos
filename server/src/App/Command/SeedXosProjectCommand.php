<?php

namespace App\Command;

use Board\Entity\Board;
use Board\Entity\BoardList;
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
    description: 'Создаёт workspace/доску и vault PKB для проекта XOS',
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

        $board = $this->seedBoard($io, $user, $force);
        $vault = $this->seedVault($io, $user, $force);

        $io->success([
            $board ? sprintf('Доска «%s» id=%d', self::BOARD_TITLE, $board->getId()) : 'Доска пропущена',
            $vault ? sprintf('Vault «XOS» slug=%s id=%d', self::VAULT_SLUG, $vault->getId()) : 'Vault пропущен',
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

    private function seedBoard(SymfonyStyle $io, User $user, bool $force): ?Board
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
            'description' => 'Roadmap проекта: приложения, долги, интеграции.',
            'background_type' => 'color',
            'background_value' => '#1b2838',
            'visibility' => 'workspace',
        ]);

        $labels = $this->createLabels($board, $user);
        $lists = [];
        foreach (['Backlog', 'In progress', 'Done', 'Приложения'] as $title) {
            $lists[$title] = $this->boardManager->createList($board, $user, ['title' => $title]);
        }

        $this->addCards($user, $lists, $labels);

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
            'bug' => '#e53935',
            'mvp' => '#43a047',
            'v2' => '#fb8c00',
            'explorer' => '#00897b',
            'schooltask' => '#8e24aa',
            'calendar' => '#1976d2',
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
    private function addCards(User $user, array $lists, array $labels): void
    {
        $card = function (
            string $list,
            string $title,
            string $description,
            array $labelKeys = [],
            ?array $checklist = null,
        ) use ($user, $lists, $labels): void {
            $created = $this->boardManager->createCard($lists[$list], $user, ['title' => $title]);
            $this->boardManager->updateCard($created, $user, ['description_md' => $description]);
            $ids = [];
            foreach ($labelKeys as $key) {
                if (isset($labels[$key])) {
                    $ids[] = (int) $labels[$key]->getId();
                }
            }
            if ($ids !== []) {
                $this->boardManager->setCardLabels($created, $user, $ids);
            }
            if ($checklist !== null) {
                $cl = $this->boardManager->createChecklist($created, $user, ['title' => $checklist['title']]);
                foreach ($checklist['items'] as $item) {
                    $this->boardManager->addChecklistItem($cl, $user, ['text' => $item]);
                }
            }
        };

        $card('Backlog', 'SchoolTask: исправить права тьютор / ROOT / Access', <<<'MD'
См. [[SchoolTask]] и `docs/schooltask/REVIEW.md`.

Критично: B1–B3, F1–F3 (тьютор vs scope, публичные uploads, user_ids, FormData, launch editor).
MD, ['schooltask', 'bug']);

        $card('Backlog', 'Explorer: dirty-close notepad / markdown', <<<'MD'
Manual DoD из [[Explorer]]: dirty-close и save после F5 для notepad и markdown.
MD, ['explorer']);

        $card('Backlog', 'Board v2: live-updates и глобальный поиск', <<<'MD'
Out of scope MVP: Mercure, global search, Trello import, email-уведомления.

См. `docs/board/PLAN.md`.
MD, ['v2']);

        $card('Backlog', 'PKB v3: plugins, encryption, co-editing', <<<'MD'
Plugin API, encryption at-rest, real-time. См. [[PKB]] и `docs/pkb/PLAN.md`.
MD, ['v2']);

        $card('In progress', 'Документация приложений', <<<'MD'
Каталог `docs/APPS.md`, ТЗ по доменам, индекс `docs/README.md`.
MD, ['docs', 'mvp'], [
            'title' => 'Осталось',
            'items' => [
                'Сверять ТЗ с кодом при крупных фичах',
                'Дописать API_SPEC для Board',
            ],
        ]);

        $card('Done', 'Календарь: overlay Доска + Todo + SchoolTask', <<<'MD'
Карточки с due_date и заметки с due_at отображаются в Календаре.
MD, ['calendar', 'mvp']);

        $card('Done', 'Board MVP (фазы 0–4)', <<<'MD'
Workspaces, Kanban DnD, карточка, чеклисты, фильтры, activity.
MD, ['mvp']);

        $card('Done', 'PKB MVP (фазы 0–6)', <<<'MD'
Vaults, редактор, wikilinks, graph, search, sharing.
MD, ['mvp']);

        $card('Done', 'Explorer pickers и multi-instance', <<<'MD'
Open/Save As, documentPath per window, media singleInstance.
MD, ['explorer', 'mvp']);

        $apps = [
            'Main' => 'Пользователи, группы, OU, claimants.',
            'Device' => 'Учёт оборудования, лицензии, ПО.',
            'Explorer' => 'VFS, просмотрщики, pickers.',
            'SchoolTask' => 'Расписание, классы, уроки.',
            'IncCom' => 'Доходы и расходы.',
            'Calendar' => 'События + overlay due dates.',
            'Todo' => 'Списки, sharing, due_at.',
            'Board' => 'Kanban workspaces.',
            'PKB' => 'Vaults, wikilinks, graph.',
            'Система' => 'Settings, browser, игры.',
        ];
        foreach ($apps as $title => $desc) {
            $card('Приложения', $title, $desc."\n\nСм. `docs/` и заметку в vault [[Home]].", ['docs']);
        }
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

        foreach ($this->vaultNotes() as $path => $content) {
            $this->vaultFiles->putContent($vault, $user, $path, $content);
        }

        $io->text(sprintf('Vault id=%d path=%s', $vault->getId(), $vault->getRootPath()));

        return $vault;
    }

    /** @return array<string, string> */
    private function vaultNotes(): array
    {
        return [
            'Notes/Home.md' => <<<'MD'
# XOS

Веб-CRM с desktop-окружением в браузере: окна, меню «Пуск», JWT API.

## Стек

- Backend: Symfony 7, Doctrine, MySQL
- Frontend: React 19, Vite, Mantine, Zustand, TanStack Query
- Auth: JWT + claimants / scopes

## Карта приложений

- [[Main]] — администрирование
- [[Device]] — учёт оборудования
- [[Explorer]] — файлы
- [[SchoolTask]] — расписание
- [[IncCom]] — финансы
- [[Calendar]] — календарь
- [[Todo]] — заметки
- [[Board]] — канбан
- [[PKB]] — база знаний
- [[Система]] — settings, browser, игры

## Документы в репозитории

Индекс: `docs/README.md` · каталог: `docs/APPS.md`
MD,
            'Notes/Apps/Main.md' => <<<'MD'
# Main

Claimant `main`. Роль `ROLE_MAIN`.

Приложения: `main-users`, `main-user`, `main-groups`, `main-group`, `main-ous`, `main-ou`, `main-claimants`, `main-claimant`.

API: `/api/main/`

Синхронизация прав: `php bin/console main:claimant:sync`

← [[Home]]
MD,
            'Notes/Apps/Device.md' => <<<'MD'
# Device

Claimant `device`. Устройства, комплектующие, типы, свойства, ПО, лицензии.

Карточка устройства: учёт, свойства, ремонты, изображения, файлы.

API: `/api/device/`

← [[Home]]
MD,
            'Notes/Apps/Explorer.md' => <<<'MD'
# Explorer

VFS пользователя, pickers, notepad, markdown, image, archiver, audio/video.

- Multi-instance: explorer, notepad, markdown, image, archiver
- Single-instance: audio, video
- Persist: `WIN.documentPath`

Долг: dirty-close notepad/markdown (manual).

← [[Home]] · см. также [[Calendar]] (файлы уроков через picker)
MD,
            'Notes/Apps/SchoolTask.md' => <<<'MD'
# SchoolTask

Предметы → классы → расписание → уроки учителя.

Overlay в [[Calendar]]: «Моё расписание».

Backlog: `docs/schooltask/REVIEW.md` (права тьютора, uploads, IDOR).

← [[Home]]
MD,
            'Notes/Apps/IncCom.md' => <<<'MD'
# IncCom

Учёт доходов и расходов. Claimant `inccom` (`can_read` / `can_write`).

API: `/api/IncCom/`

← [[Home]]
MD,
            'Notes/Apps/Calendar.md' => <<<'MD'
# Calendar

Личные календари, шаринг, overlay:

| Overlay | Источник |
|---------|----------|
| Заметки | [[Todo]] `due_at` |
| Доска | [[Board]] `due_date` |
| Расписание | [[SchoolTask]] teacher events |

API: `/api/calendar/`

← [[Home]]
MD,
            'Notes/Apps/Todo.md' => <<<'MD'
# Todo

Списки, пункты, markdown-заметки, sharing по email.

Due items → overlay «Заметки» в [[Calendar]].

API: `/api/todo/`

← [[Home]]
MD,
            'Notes/Apps/Board.md' => <<<'MD'
# Board

Kanban: workspaces → boards → lists → cards.

MVP: DnD, чеклисты, комментарии, вложения, фильтры, activity.

Карточки со сроком → [[Calendar]].

API: `/api/board/`

← [[Home]]
MD,
            'Notes/Apps/PKB.md' => <<<'MD'
# PKB

Vault = папка Explorer + индекс в БД.

Wikilinks `[[Note]]`, backlinks, graph, search, sharing.

Этот vault — проектная база знаний [[Home]].

API: `/api/pkb/`

← [[Home]]
MD,
            'Notes/Apps/Система.md' => <<<'MD'
# Система

- Settings — тема, desktop-state
- Browser — proxy `/api/browser/proxy`
- Игры: шахматы, крестики-нолики, судоку
- demo-calculator — образец приложения

← [[Home]]
MD,
            'Notes/Architecture.md' => <<<'MD'
# Architecture

Модули `server/src/`: App, Main, Device, Explorer, IBlock, IncCom, SchoolTask, Calendar, Todo, Board, Pkb.

Клиент: `client/src/apps/*` (55 манифестов) + `client/src/features/*`.

Защищённые модули: `ProtectedAppModules`.

Связано: [[Home]], [[Board]], [[PKB]]
MD,
        ];
    }
}
