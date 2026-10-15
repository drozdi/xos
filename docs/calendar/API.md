# API — календарь

Роль `ROLE_CALENDAR`.

| Метод | Путь | Назначение |
|-------|------|------------|
| POST, GET | `/api/calendar/auth/login` | Вход стенда |
| GET | `/api/calendar/auth/me` | Кто вошёл |
| POST | `/api/calendar/auth/logout` | Выход |
| GET, POST | `/api/calendar/calendars` | Список и создание |
| GET, PUT, DELETE | `/api/calendar/calendars/{id}` | Карточка |
| POST | `/api/calendar/calendars/{id}/share` | Открыть пользователю |
| DELETE | `/api/calendar/calendars/{id}/share/{userId}` | Закрыть |
| POST | `/api/calendar/calendars/{id}/share-group` | Открыть группе |
| DELETE | `/api/calendar/calendars/{id}/share-group/{groupId}` | Закрыть группу |
| GET | `/api/calendar/users/by-email` | Найти пользователя |
| GET | `/api/calendar/groups/by-code` | Найти группу |
| POST | `/api/calendar/events/query` | События интервала |
| POST | `/api/calendar/events` | Создать |
| PUT, DELETE | `/api/calendar/events/{id}` | Правка и удаление |
