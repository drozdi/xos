# ТЗ — Todo (заметки)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Списки задач/заметок с дедлайнами, markdown-заметками и совместным доступом.

## 2. Пользователи и доступ

- **Claimant:** `todo`, `todo.list`
- **Права list:** `can_create`, `can_read`, `can_update`, `can_delete`, `can_share`
- Проверка: `canUseTodo()`

## 3. Приложения

| ID | Название | Описание |
|----|----------|----------|
| todo | Заметки | Списки и пункты |

## 4. Функциональные требования

### Списки
- CRUD списков (title, color)
- Markdown-заметка к списку (`notes_md`)

### Пункты
- CRUD items: text, done, `due_at`
- Сортировка, чекбоксы

### Sharing
- Invite по email (read/write)
- Управление участниками

### Интеграция
- Due items → **Calendar** overlay «Заметки»
- Invalidate calendar on due change

## 5. API

**Prefix:** `/api/todo/`

| Ресурс | Описание |
|--------|----------|
| Lists | CRUD `/lists` |
| Items | CRUD `/items` |
| Share | `/lists/{id}/share` |
| Due | `GET /due?start=&end=` |

## 6. Backend / Frontend

```
server/src/Todo/
client/src/apps/todo/
client/src/features/todo/
```

## 7. Критерии приёмки

- [x] CRUD списков и пунктов
- [x] due_at отображается в Calendar
- [x] Sharing по email
- [x] Markdown notes в редакторе списка

## 8. Связанные документы

- [README.md](README.md)
- [calendar/TZ.md](../calendar/TZ.md)
