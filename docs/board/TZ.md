# ТЗ — Board (Kanban-доска)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **MVP реализован**

## 1. Назначение

Trello-like планирование: workspaces → boards → lists → cards с коллаборацией и правами.

## 2. Пользователи и доступ

- **Claimant:** `board`
- **Права:** `can_read`, `can_write`
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

## 6. Out of scope (v2)

Real-time, global search, Trello import, email notifications — см. [PLAN.md](PLAN.md).

## 7. Критерии приёмки (MVP)

- [x] Full Kanban CRUD + DnD
- [x] Card modal: checklists, comments, attachments
- [x] Filters on board
- [x] Calendar due overlay
- [x] PermissionResolver + roles

## 8. Связанные документы

- [README.md](README.md)
- [PLAN.md](PLAN.md) · [TODO.md](TODO.md)
- [calendar/TZ.md](../calendar/TZ.md)
