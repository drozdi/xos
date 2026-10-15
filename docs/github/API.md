# API — GitHub

Роль `ROLE_GITHUB`. Сервер ходит в GitHub сам.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET, PUT, DELETE | `/api/github/credentials` | Токен и репозиторий по умолчанию |
| POST | `/api/github/connection/test` | Проверка |
| GET | `/api/github/issues` | Список. Query: `owner`, `repo`, `state`, `page`, `per_page` |
| GET | `/api/github/issues/{number}` | Карточка |
| PATCH | `/api/github/issues/{number}` | Название, текст, состояние |
