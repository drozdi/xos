# API — TeamStorm

Префикс `/api/ts`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ts/credentials` | Учётные данные |
| PUT | `/api/ts/credentials` | Записать |
| DELETE | `/api/ts/credentials` | Удалить |
| POST | `/api/ts/connection/test` | Проверить соединение |
| GET | `/api/ts/workspaces` | Пространства |
| GET | `/api/ts/workspaces/{workspace}/workitems` | Задачи |
| GET | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Карточка |
| PATCH | `/api/ts/workspaces/{workspace}/workitems/{workitem}` | Изменить |
