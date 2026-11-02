# API — TeamStorm

Префикс `/api/ts`. Роль `ROLE_TS`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ts/credentials` | Учётные данные без секрета |
| PUT | `/api/ts/credentials` | URL и PrivateToken |
| DELETE | `/api/ts/credentials` | Удалить |
| POST | `/api/ts/connection/test` | Проверить соединение |
| GET | `/api/ts/workspaces` | Пространства TeamStorm |
| GET | `/api/ts/workspaces/{workspace}/workitems` | Задачи пространства |
| GET | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Карточка |
| PATCH | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Изменить на стороне TeamStorm |

`POST` и `DELETE` для work item нет.
