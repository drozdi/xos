# Board — доска (Kanban)

Trello-like планирование: workspaces → boards → lists → cards.

## Claimant

- **Код:** `board`
- **Права:** `can_read`, `can_write`

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

## Интеграция с Calendar

Карточки с `due_date` → `GET /api/board/cards/due?start=&end=` → overlay «Доска» в календаре.

## Доступ

`canUseBoard()` — права модуля board.

## Документы разработки

| Файл | Содержание |
|------|------------|
| [PLAN.md](PLAN.md) | Полный план MVP + v2 |
| [TODO.md](TODO.md) | Трекинг задач |
