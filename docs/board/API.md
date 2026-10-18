# API — доска

Префикс `/api/board`. Роль `ROLE_BOARD`.

## Пространство

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/board/workspaces` | Список |
| POST | `/api/board/workspaces` | Создать |
| GET | `/api/board/workspaces/{id}` | Карточка |
| PUT | `/api/board/workspaces/{id}` | Изменить |
| DELETE | `/api/board/workspaces/{id}` | Удалить |
| GET | `/api/board/workspaces/{id}/members` | Участники |
| POST | `/api/board/workspaces/{id}/members` | Пригласить |
| PUT | `/api/board/workspaces/{id}/members/{userId}` | Сменить роль |
| DELETE | `/api/board/workspaces/{id}/members/{userId}` | Убрать |
| GET | `/api/board/health` | Живость модуля |

## Доска

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/board/workspaces/{wsId}/boards` | Создать в пространстве |
| GET | `/api/board/boards/{id}` | Карточка |
| PUT | `/api/board/boards/{id}` | Изменить |
| DELETE | `/api/board/boards/{id}` | Удалить |
| GET | `/api/board/boards/{id}/cards` | Карточки с фильтром |
| GET | `/api/board/boards/{id}/members` | Участники |
| POST | `/api/board/boards/{id}/members` | Добавить |
| PUT | `/api/board/boards/{id}/members/{userId}` | Сменить роль |
| DELETE | `/api/board/boards/{id}/members/{userId}` | Убрать |
| GET | `/api/board/boards/{id}/activity` | Активность |
| GET | `/api/board/boards/{id}/changes` | Изменения |
| GET | `/api/board/boards/{id}/realtime` | Канал realtime |
| GET | `/api/board/boards/{id}/events` | События |
| GET | `/api/board/search` | Поиск |

## Колонки и метки

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/board/boards/{id}/lists` | Создать колонку |
| PUT | `/api/board/lists/{id}` | Изменить |
| DELETE | `/api/board/lists/{id}` | Удалить |
| PUT | `/api/board/boards/{id}/lists/reorder` | Порядок колонок |
| POST | `/api/board/boards/{id}/labels` | Создать метку |
| PUT | `/api/board/labels/{id}` | Изменить |
| DELETE | `/api/board/labels/{id}` | Удалить |

## Карточки

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/board/lists/{listId}/cards` | Создать в колонке |
| GET | `/api/board/cards/{id}` | Карточка |
| PUT | `/api/board/cards/{id}` | Изменить |
| DELETE | `/api/board/cards/{id}` | Удалить |
| PUT | `/api/board/cards/{id}/move` | Перенести |
| PUT | `/api/board/cards/{id}/assignees` | Исполнители |
| PUT | `/api/board/cards/{id}/labels` | Метки |
| GET | `/api/board/cards/due` | Карточки со сроком |
| GET | `/api/board/cards/linked` | Связанные |

## Чеклисты, комментарии, вложения

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/board/cards/{cardId}/checklists` | Создать чеклист |
| PUT | `/api/board/checklists/{id}` | Изменить |
| DELETE | `/api/board/checklists/{id}` | Удалить |
| POST | `/api/board/checklists/{id}/items` | Пункт |
| PUT | `/api/board/checklist-items/{id}` | Изменить пункт |
| DELETE | `/api/board/checklist-items/{id}` | Удалить пункт |
| GET | `/api/board/cards/{cardId}/comments` | Комментарии |
| POST | `/api/board/cards/{cardId}/comments` | Написать |
| PUT | `/api/board/comments/{id}` | Изменить |
| DELETE | `/api/board/comments/{id}` | Удалить |
| GET | `/api/board/cards/{cardId}/attachments` | Вложения |
| POST | `/api/board/cards/{cardId}/attachments` | Загрузить |
| POST | `/api/board/cards/{cardId}/attachments/import` | Импорт |
| GET | `/api/board/attachments/{id}/download` | Скачать |
| DELETE | `/api/board/attachments/{id}` | Удалить |
