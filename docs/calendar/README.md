# Calendar — календарь

Личные календари, события, шаринг и overlay из других модулей.

## Claimant

- **Код:** `calendar`
- **Права:** `can_read`, `can_write`

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| calendar | Календарь | День / неделя / месяц, CRUD событий |

## Backend

```
server/src/Calendar/
├── Controller/
│   ├── CalendarController.php     # CRUD календарей
│   └── EventController.php        # CRUD событий, query по диапазону
├── Entity/
└── setting.json
```

**API prefix:** `/api/calendar/`

## Frontend

```
client/src/apps/calendar/CalendarApp.tsx
client/src/features/calendar/
├── components/CalendarShell.tsx   # основной UI
├── mappers.ts                   # own / todo / board / schooltask
├── visibilityStore.ts           # overlay toggles
└── calendarAccess.ts
```

## Режимы просмотра

- **День / неделя / месяц** — `CalendarGrid`
- **Сайдбар** — список календарей + системные overlay

## Системные overlay

| Overlay | ID | Источник API |
|---------|-----|--------------|
| Заметки | `overlay:todo` | `GET /api/todo/due` |
| Доска | `overlay:board` | `GET /api/board/cards/due` |
| Моё расписание | `overlay:schooltask` | teacher events |

Карточки с `due_date` / `due_at` отображаются как read-only события; клик — модалка деталей.

## Шаринг

- По email (как Todo)
- Через группу с правами read/write

## Доступ

`canUseCalendar()` — авторизованный пользователь с правами модуля calendar.

## Документы

- [TZ.md](TZ.md) — техническое задание
