# Todo — заметки

Списки задач с дедлайнами, sharing и markdown-заметками.

## Claimant

- **Код:** `todo`, `todo.list`
- **Права list:** `can_create`, `can_read`, `can_update`, `can_delete`, `can_share`

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| todo | Заметки | Списки, пункты, заметки markdown |

## Backend

```
server/src/Todo/
├── Controller/
│   ├── ListController.php
│   ├── ItemController.php
│   └── ShareController.php
├── Entity/
└── setting.json
```

**API prefix:** `/api/todo/`

## Frontend

```
client/src/apps/todo/TodoApp.tsx
client/src/features/todo/
├── TodoListEditorModal.tsx
├── TodoShareModal.tsx
└── todoAccess.ts
```

## Функции

- Несколько списков с цветом
- Пункты: текст, done, `due_at`
- Markdown-заметка к списку
- Sharing списка по email
- Due items попадают в **Календарь** (overlay «Заметки»)

## Интеграция с Calendar

`todoApi.dueItems(start, end)` → `mapTodoDue()` в календаре.

При изменении due date в Todo — invalidate `['calendar', 'dueItems']`.

## Доступ

`canUseTodo()` — проверка прав модуля todo.

## Документы

- [TZ.md](TZ.md) — техническое задание
