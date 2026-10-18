# API — календарь

Префикс `/api/calendar`. Роль `ROLE_CALENDAR`.

## Сессия

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/calendar/auth/me` | Текущий пользователь |
| POST | `/api/calendar/auth/login` | Вход |
| GET | `/api/calendar/auth/login` | Описание входа |
| POST | `/api/calendar/auth/logout` | Выход |
| POST | `/api/calendar/token/refresh` | Обновление токена |
| GET | `/api/calendar/users/by-email` | Найти пользователя |
| GET | `/api/calendar/groups/by-code` | Найти группу |

## Календари

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/calendar/calendars` | Список |
| POST | `/api/calendar/calendars` | Создать |
| GET | `/api/calendar/calendars/{id}` | Карточка |
| PUT | `/api/calendar/calendars/{id}` | Изменить |
| DELETE | `/api/calendar/calendars/{id}` | Удалить |
| POST | `/api/calendar/calendars/{id}/share` | Открыть пользователю |
| DELETE | `/api/calendar/calendars/{id}/share/{userId}` | Закрыть |
| POST | `/api/calendar/calendars/{id}/share-group` | Открыть группе |
| DELETE | `/api/calendar/calendars/{id}/share-group/{groupId}` | Закрыть группе |

## События

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/calendar/events/query` | События за интервал |
| POST | `/api/calendar/events` | Создать |
| PUT | `/api/calendar/events/{id}` | Изменить |
| DELETE | `/api/calendar/events/{id}` | Удалить |
