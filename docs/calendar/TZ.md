# ТЗ — Calendar (календарь)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Личные и shared-календари, события, агрегация дедлайнов из Todo, Board и расписания SchoolTask.

## 2. Пользователи и доступ

- **Claimant:** `calendar`
- **Права:** `can_read`, `can_write`
- Проверка: `canUseCalendar()`

## 3. Приложения

| ID | Название | Описание |
|----|----------|----------|
| calendar | Календарь | День / неделя / месяц |

## 4. Функциональные требования

### Собственные календари
- CRUD календарей (title, color)
- CRUD событий: title, start/end, all_day, description, color
- Drag/create в grid (editable events)

### Шаринг
- По email (read/write)
- Через группу

### Overlay (read-only)
| Источник | Условие |
|----------|---------|
| Заметки (Todo) | `due_at`, overlay «Заметки» |
| Доска (Board) | `due_date`, overlay «Доска» |
| SchoolTask | teacher events, overlay «Моё расписание» |

### UI
- Sidebar: visibility toggles
- Клик overlay → модалка деталей
- Refresh invalidates all sources

## 5. API

**Prefix:** `/api/calendar/`

| Endpoint | Описание |
|----------|----------|
| `GET/POST /calendars` | Календари |
| `GET/POST/PUT/DELETE /events` | События |
| `POST /events/query` | Диапазон + calendar_ids |
| Share endpoints | email / group |

**Overlay (другие модули):**
- `GET /api/todo/due`
- `GET /api/board/cards/due`
- `GET /api/schooltask/calendar/teacher-events`

## 6. Backend / Frontend

```
server/src/Calendar/
client/src/apps/calendar/
client/src/features/calendar/
```

## 7. Критерии приёмки

- [x] CRUD календарей и событий
- [x] Sharing read/write
- [x] Overlay Todo + Board + SchoolTask
- [x] Visibility persist в localStorage

## 8. Связанные документы

- [README.md](README.md)
- [todo/TZ.md](../todo/TZ.md) · [board/TZ.md](../board/TZ.md)
