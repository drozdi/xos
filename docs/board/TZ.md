# ТЗ — Board (Kanban-доска)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **MVP реализован**

## 1. Назначение

Trello-like планирование: workspaces → boards → lists → cards с коллаборацией и правами.

## 2. Пользователи и доступ

- **Роль:** `ROLE_BOARD` (`ProtectedAppModules`); манифест `requiredRole: 'board'`
- **Claimant:** `board` — `can_read`, `can_write`
- Роли workspace/board: owner, admin, editor, observer
- Проверка: `canUseBoard()`

## 3. Приложения

| ID | Название | Описание |
|----|----------|----------|
| board | Доска | Dashboard + Kanban view |

## 4. Функциональные требования

### Workspace / Board
- CRUD workspaces и boards
- Invite по email, роли
- Background (color/image/gradient), visibility private/workspace

### Kanban
- Lists + cards, DnD reorder (`@dnd-kit`)
- Quick add list/card
- Filters: assignee, labels, due range, search

### Card
- title, description (Markdown), due_date, cover_color
- Labels, assignees (multi)
- Checklists + items (checked)
- Comments, attachments
- CardModal

### Activity
- Append-only log per board

### Интеграция
- Cards с `due_date` → Calendar overlay «Доска»

## 5. API

**Prefix:** `/api/board/`

| Группа | Endpoints |
|--------|-----------|
| Workspaces | CRUD, members |
| Boards | CRUD, members, activity, filter |
| Lists | CRUD, reorder |
| Cards | CRUD, move, `GET /cards/due` |
| Checklists | CRUD items |
| Comments / Attachments | CRUD |

Upload: module `board` в UploadPathResolver.

## 6. Реализовано сверх MVP / backlog

| Статус | Тема |
|--------|------|
| DONE | SSE `/boards/{id}/events`, optional Mercure, polling fallback |
| DONE | Conflict `expected_updated_at` → 409; global search |
| Backlog | Trello import, email notify — [APP_IDEAS.md](../APP_IDEAS.md) |

UI prefs: `board.ui.*` в `user_app_data` (`getOptional`).

## 7. Критерии приёмки (MVP)

- [x] Full Kanban CRUD + DnD
- [x] Card modal: checklists, comments, attachments
- [x] Filters on board
- [x] Calendar due overlay
- [x] PermissionResolver + roles
- [x] SSE / conflict 409

## 8. Связанные документы

- [README.md](README.md)
- [calendar/TZ.md](../calendar/TZ.md)
- [APP_IDEAS.md](../APP_IDEAS.md)
- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)
