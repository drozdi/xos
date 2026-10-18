# API — почта

Префикс `/api/inbox`. Роль `ROLE_INBOX`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/inbox/messages` | Список |
| POST | `/api/inbox/messages` | Отправить |
| GET | `/api/inbox/messages/{id}` | Карточка |
| POST | `/api/inbox/messages/{id}/read` | Отметить прочитанным |
| DELETE | `/api/inbox/messages/{id}` | Удалить |
