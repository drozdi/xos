# Календарь

Несколько календарей, события за интервал и доступ людям и группам.

Доступ: `ROLE_CALENDAR`. Одно окно `calendar`. Код: `server/src/Calendar`, `client/src/apps/calendar`.

## Сценарий

Пользователь создаёт календарь, кладёт события и открывает календарь коллеге по email или группе по коду. Сетка запрашивает события пачкой: `POST /api/calendar/events/query`. Повтор, если он есть, приходит отдельными событиями, одного ряда в API нет.

Свой вход модуля: `POST /api/calendar/auth/login`. Стол пользуется общим `/api/login`. Refresh календаря — `POST /api/calendar/token/refresh` и cookie `xos_app_refresh`.

См. [TZ.md](TZ.md), [API.md](API.md).
