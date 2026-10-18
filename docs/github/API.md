# API — GitHub

Префикс `/api/github`. Роль `ROLE_GITHUB`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/github/credentials` | Учётные данные |
| PUT | `/api/github/credentials` | Записать |
| DELETE | `/api/github/credentials` | Удалить |
| POST | `/api/github/connection/test` | Проверить токен |
| GET | `/api/github/issues` | Список issues |
| GET | `/api/github/issues/{number}` | Карточка |
| PATCH | `/api/github/issues/{number}` | Изменить |
