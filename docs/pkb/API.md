# API — база знаний

Префикс `/api/pkb`. Роль `ROLE_PKB`. `{id}` — id хранилища.

## Хранилище

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/pkb/health` | Живость |
| GET | `/api/pkb/vaults` | Список |
| POST | `/api/pkb/vaults` | Создать |
| GET | `/api/pkb/vaults/{id}` | Карточка |
| PUT | `/api/pkb/vaults/{id}` | Изменить |
| DELETE | `/api/pkb/vaults/{id}` | Удалить |
| GET | `/api/pkb/vaults/{id}/export` | Экспорт |
| POST | `/api/pkb/vaults/{id}/remote-sync` | Внешняя синхронизация |
| GET | `/api/pkb/vaults/{id}/bookmarks` | Закладки |
| PUT | `/api/pkb/vaults/{id}/bookmarks` | Записать закладки |

## Участники

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/pkb/vaults/{id}/members` | Список |
| POST | `/api/pkb/vaults/{id}/members` | Пригласить |
| PUT | `/api/pkb/vaults/{id}/members/{userId}` | Сменить роль |
| DELETE | `/api/pkb/vaults/{id}/members/{userId}` | Убрать |

## Файлы

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/pkb/vaults/{id}/files/tree` | Дерево |
| GET | `/api/pkb/vaults/{id}/files/content` | Прочитать |
| PUT | `/api/pkb/vaults/{id}/files/content` | Записать |
| POST | `/api/pkb/vaults/{id}/files/upload` | Загрузить |
| POST | `/api/pkb/vaults/{id}/files/folder` | Папка |
| PATCH | `/api/pkb/vaults/{id}/files/rename` | Переименовать |
| DELETE | `/api/pkb/vaults/{id}/files/item` | Удалить |

## Индекс

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/pkb/vaults/{id}/notes` | Заметки |
| GET | `/api/pkb/vaults/{id}/notes/by-title` | Заметка по заголовку |
| GET | `/api/pkb/vaults/{id}/backlinks` | Обратные ссылки |
| GET | `/api/pkb/vaults/{id}/graph` | Граф |
| GET | `/api/pkb/vaults/{id}/search` | Поиск |
| POST | `/api/pkb/vaults/{id}/search/replace` | Замена |
| GET | `/api/pkb/vaults/{id}/index/status` | Статус индекса |
| POST | `/api/pkb/vaults/{id}/index/rebuild` | Пересобрать |
