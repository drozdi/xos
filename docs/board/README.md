# Board — доска (Kanban)

Trello-like планирование: workspaces → boards → lists → cards.

## Доступ

- **Роль:** `ROLE_BOARD` (`ProtectedAppModules`)
- **Манифест:** `requiredRole: 'board'`, `canAccess: canUseBoard()`
- **Claimant:** `board` — `can_read`, `can_write`
- Роли workspace/board: owner, admin, editor, observer

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| board | Доска | Dashboard workspaces + Kanban view |

## Backend

```
server/src/Board/
├── Controller/
│   ├── WorkspaceController.php
│   ├── BoardController.php
│   ├── ListController.php
│   ├── CardController.php          # + GET /cards/due для календаря
│   ├── ChecklistController.php
│   ├── CommentController.php
│   └── AttachmentController.php
├── Entity/
├── Service/BoardManager.php
└── setting.json
```

**API prefix:** `/api/board/`

## Frontend

```
client/src/apps/board/BoardApp.tsx
client/src/features/board/
├── DashboardPage.tsx      # workspaces
├── BoardViewPage.tsx      # Kanban + DnD
├── CardModal.tsx          # карточка
├── BoardFilters.tsx
└── dnd/                   # @dnd-kit
```

## MVP-функции

| Область | Реализовано |
|---------|-------------|
| Workspaces / boards | CRUD, invite, роли |
| Lists / cards | CRUD, DnD reorder |
| Card | title, description (MD), due date, labels, assignees |
| Checklists | пункты, checked |
| Comments | CRUD |
| Attachments | upload через `UploadPathResolver` (module `board`) |
| Filters | assignee, labels, due range, search |
| Activity log | `GET /boards/{id}/activity` |
| Realtime | SSE `/boards/{id}/events`; optional Mercure (`MERCURE_*`); polling fallback |
| Conflict | `expected_updated_at` → 409 на PUT card |
| UI prefs | `board.ui.*` → `user_app_data` (`getOptional`) |

## Интеграция с Calendar

Карточки с `due_date` → `GET /api/board/cards/due?start=&end=` → overlay «Доска» в календаре.

## Доступ

`canUseBoard()` — права модуля board.

## Документы разработки

| Файл | Содержание |
|------|------------|
| [TZ.md](TZ.md) | Техническое задание |
| [APP_IDEAS.md](../APP_IDEAS.md) | Бэклог (email notify, Trello import) |
