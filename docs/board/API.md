# API — доска

Префикс `/api/board`. Роль `ROLE_BOARD`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/health` | Проверка модуля |
| GET, POST | `/workspaces` | Пространства |
| GET, PUT, DELETE | `/workspaces/{id}` | Карточка |
| GET, POST | `/workspaces/{id}/members` | Участники |
| PUT, DELETE | `/workspaces/{id}/members/{userId}` | Роль |
| POST | `/workspaces/{wsId}/boards` | Создать доску |
| GET, PUT, DELETE | `/boards/{id}` | Доска |
| GET | `/boards/{id}/cards` | Карточки доски |
| GET, POST | `/boards/{id}/members` | Участники доски |
| PUT, DELETE | `/boards/{id}/members/{userId}` | Роль |
| GET | `/boards/{id}/activity` | Журнал |
| GET | `/boards/{id}/changes` | Изменения с `since` |
| GET | `/boards/{id}/realtime` | Mercure или SSE |
| GET | `/boards/{id}/events` | Поток SSE |
| GET | `/search` | Поиск, query `q` и `limit` |
| POST | `/boards/{id}/lists` | Колонка |
| PUT, DELETE | `/lists/{id}` | Правка колонки |
| PUT | `/boards/{id}/lists/reorder` | Порядок колонок |
| GET | `/cards/due` | Сроки, query `start` и `end` |
| GET | `/cards/linked` | Связанные карточки |
| POST | `/lists/{listId}/cards` | Создать карточку |
| GET, PUT, DELETE | `/cards/{id}` | Карточка |
| PUT | `/cards/{id}/move` | Перенос |
| PUT | `/cards/{id}/assignees` | Исполнители |
| PUT | `/cards/{id}/labels` | Метки |
| POST | `/boards/{id}/labels` | Создать метку |
| PUT, DELETE | `/labels/{id}` | Метка |
| POST | `/cards/{cardId}/checklists` | Чеклист |
| PUT, DELETE | `/checklists/{id}` | Чеклист |
| POST | `/checklists/{id}/items` | Пункт |
| PUT, DELETE | `/checklist-items/{id}` | Пункт |
| GET, POST | `/cards/{cardId}/comments` | Комментарии |
| PUT, DELETE | `/comments/{id}` | Комментарий |
| GET, POST | `/cards/{cardId}/attachments` | Файлы |
| POST | `/cards/{cardId}/attachments/import` | Импорт файла |
| GET | `/attachments/{id}/download` | Скачать |
| DELETE | `/attachments/{id}` | Удалить файл |

Лимит колонки, шаблоны и внешняя ссылка в этот API не входят: это `/api/user-data`.
