# API — почта

Префикс `/api/inbox`. Роль `ROLE_INBOX`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/inbox/messages` | Входящие и исходящие текущего пользователя |
| POST | `/api/inbox/messages` | Отправить. Получатель — пользователь XOS |
| GET | `/api/inbox/messages/{id}` | Карточка |
| POST | `/api/inbox/messages/{id}/read` | Отметить прочитанным |
| DELETE | `/api/inbox/messages/{id}` | Удалить |

Тело правки письма и вложения в маршрутах не предусмотрены.
