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
        $this->addRoadmapCards($user, $lists, $labels);

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
    private function addRoadmapCards(User $user, array $lists, array $labels): void
    {
        $card = function (
            string $title,
            string $description,
            array $labelKeys = [],
            ?array $checklist = null,
        ) use ($user, $lists, $labels): void {
            $created = $this->boardManager->createCard($lists['Roadmap'], $user, ['title' => $title]);
            $this->boardManager->updateCard($created, $user, ['description_md' => $description]);
            $this->applyLabels($created, $user, $labels, $labelKeys);
            if ($checklist !== null) {
                $cl = $this->boardManager->createChecklist($created, $user, ['title' => $checklist['title']]);
                foreach ($checklist['items'] as $item) {
                    $this->boardManager->addChecklistItem($cl, $user, ['text' => $item]);
                }
            }
        };

        $card('SchoolTask: исправить права тьютор / ROOT / Access', <<<'MD'
См. [[SchoolTask]] и `docs/schooltask/REVIEW.md`.

Критично: B1–B3, F1–F3 (тьютор vs scope, публичные uploads, user_ids, FormData, launch editor).
MD, ['schooltask', 'bug']);

        $card('Explorer: dirty-close notepad / markdown', <<<'MD'
Manual DoD из [[Explorer]]: dirty-close и save после F5 для notepad и markdown.
MD, ['explorer']);

        $card('Board v2: live-updates и глобальный поиск', <<<'MD'
Out of scope MVP: Mercure, global search, Trello import, email-уведомления.

См. `docs/board/PLAN.md` и [[Board]].
MD, ['board', 'v2']);

        $card('PKB v3: plugins, encryption, co-editing', <<<'MD'
Plugin API, encryption at-rest, real-time. См. [[PKB]] и `docs/pkb/PLAN.md`.
MD, ['pkb', 'v2']);

        $card('Документация приложений', <<<'MD'
Каталог `docs/APPS.md`, ТЗ по доменам, индекс `docs/README.md`. Связано с [[AppsCatalog]] и vault XOS.
MD, ['docs', 'mvp'], [
            'title' => 'Осталось',
            'items' => [
                'Сверять ТЗ с кодом при крупных фичах',
                'Дописать API_SPEC для Board',
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

        return array_merge($overview, $modules);
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
                'cardDescription' => "Доходы и расходы, чеки ФНС.\n\nЗаметка: [[IncCom]] · API `/api/IncCom/`",
                'body' => <<<'MD'
# IncCom

Claimant `inccom` (`can_read` / `can_write`) · `server/src/IncCom/` · `client/src/features/inccom/` · app `inccom`

## Назначение

Счета, категории, транзакции (доход/расход), переводы, товары. QR фискальных полей; проверка чека через OpenAPI ФНС (per-user credentials, `receipt_json` на транзакции).

## Приложения

| ID | Название |
|----|----------|
| `inccom` | Доходы и расходы |

## Ключевое

- API: `/api/IncCom/`
- ФНС: `/api/IncCom/fns/credentials`, `…/receipts/preview`, `…/transactions/{id}/receipt/fetch`
- Документы: `docs/inccom/README.md`, `TZ.md`

← [[Home]] · [[AppsCatalog]]
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
                'cardDescription' => "Kanban workspaces.\n\nЗаметка: [[Board]] · API `/api/board/`",
                'body' => <<<'MD'
# Board

Claimant `board` · `server/src/Board/` · `client/src/features/board/` · app `board`

## Назначение

Workspaces → boards → lists → cards. DnD, чеклисты, комментарии, вложения, фильтры, activity, labels.

## Связь с [[PKB]]

На карточке: `pkb_vault_id` + `pkb_note_path`. UI: привязка / создание `Board/{boardId}/{cardId}.md`, invite readers. Обратно: `GET /api/board/cards/linked`.

Эта доска «XOS — roadmap» связана с vault `slug=xos`.

## Приложения

`board`

← [[Home]] · [[PKB]] · [[Calendar]]
MD,
            ],
            [
                'title' => 'PKB',
                'notePath' => 'Notes/Apps/PKB.md',
                'labels' => ['pkb'],
                'cardDescription' => "База знаний (vaults).\n\nЗаметка: [[PKB]] · API `/api/pkb/`",
                'body' => <<<'MD'
# PKB

Claimant `pkb` · `server/src/Pkb/` · `client/src/features/pkb/` · app `pkb`

## Назначение

Vault = папка [[Explorer]] + индекс в БД. Wikilinks `[[Note]]`, backlinks, graph, search, sharing.

Этот vault **XOS** (`slug=xos`) — проектная документация: [[Home]], [[Architecture]], [[AppsCatalog]], модули в `Notes/Apps/`.

## Приложения

`pkb`

← [[Home]] · [[Board]] · [[Explorer]]
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
                'cardDescription' => "Инфоблоки API (без desktop-app).\n\nЗаметка: [[IBlock]]",
                'body' => <<<'MD'
# IBlock

`server/src/IBlock/` — API инфоблоков. Отдельного окна в меню «Пуск» нет.

## Назначение

CRUD инфоблоков для интеграций / legacy-клиентов. Claimant в `setting.json` без desktop-приложения.

## Документы

См. общий `docs/API_SPEC.md`, индекс `docs/README.md`.

← [[Home]] · [[Architecture]]
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

## Документы в репозитории

Индекс: `docs/README.md` · каталог: `docs/APPS.md` · архитектура: `docs/ARCHITECTURE.md`

Seed: `php bin/console xos:seed-project [--login=] [--force]`
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
| IBlock | — | нет desktop-app |

Детали по модулям: [[Main]], [[Device]], [[Explorer]], [[SchoolTask]], [[IncCom]], [[Calendar]], [[Todo]], [[Board]], [[PKB]], [[System]], [[IBlock]]

← [[Home]] · [[Architecture]]
MD,
        ];

        foreach ($this->moduleCatalog() as $mod) {
            $notes[$mod['notePath']] = $mod['body'];
        }

        return $notes;
    }
}
