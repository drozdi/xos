# API — почта

Префикс `/api/inbox/messages`. Роль `ROLE_INBOX`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/inbox/messages` | Список. Query `box`: `inbox` или `sent` |
| POST | `/api/inbox/messages` | Создать. Тело: `to_email` или `to_user_id`, `subject`, `body_md` |
| GET | `/api/inbox/messages/{id}` | Письмо |
| POST | `/api/inbox/messages/{id}/read` | Прочитано |
| DELETE | `/api/inbox/messages/{id}` | Удалить |

Вложение: `POST /api/main/file/upload` с `module=inbox`. См. [../API.md](../API.md).
