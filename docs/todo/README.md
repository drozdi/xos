# Todo — заметки

Списки задач с дедлайнами, sharing и markdown-заметками.

## Доступ

- **App shell:** любой авторизованный (`canUseTodo()` → `ROLE_USER`). Модуль **не** в `ProtectedAppModules` (нет `ROLE_TODO`).
- **Claimant (каталог прав):** `todo`, `todo.list` — опции `can_create|read|update|delete|share` в Main Admin; API списков — владелец / share, не роль модуля.

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

`canUseTodo()` — только «залогинен»; ACL на уровне списков.

## Документы

- [TZ.md](TZ.md) — техническое задание
