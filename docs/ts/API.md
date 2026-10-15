# API — TeamStorm

Роль `ROLE_TS`. Сервер сам вызывает TeamStorm, браузер ходит только сюда.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET, PUT, DELETE | `/api/ts/credentials` | Связь, без сырого токена в GET |
| POST | `/api/ts/connection/test` | Проверка |
| GET | `/api/ts/workspaces` | Пространства |
| GET | `/api/ts/workspaces/{workspace}/workitems` | Задачи. `mine=1` — только свои |
| GET | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Карточка |
| PATCH | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Правка названия и описания |
