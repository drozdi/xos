# API — GitHub

Префикс `/api/github`. Роль `ROLE_GITHUB`.

## Учётные данные

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/github/credentials` | Что сохранено, без самого токена |
| PUT | `/api/github/credentials` | Записать токен и репозиторий |
| DELETE | `/api/github/credentials` | Удалить |
| POST | `/api/github/connection/test` | Проверить токен запросом к GitHub |

## Issues

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/github/issues` | Список issues репозитория из учётных данных |
| GET | `/api/github/issues/{number}` | Одна issue |
| PATCH | `/api/github/issues/{number}` | Частичное изменение на стороне GitHub |

Отдельного `POST` для новой issue нет.
