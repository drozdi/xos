# API — база знаний

Префикс `/api/pkb`. Роль `ROLE_PKB`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/health` | Проверка |
| GET, POST | `/vaults` | Хранилища |
| GET, PUT, DELETE | `/vaults/{id}` | Карточка |
| GET | `/vaults/{id}/export` | ZIP |
| POST | `/vaults/{id}/remote-sync` | Отправить копию |
| GET, POST | `/vaults/{id}/members` | Участники |
| PUT, DELETE | `/vaults/{id}/members/{userId}` | Роль |
| GET | `/vaults/{id}/files/tree` | Дерево |
| GET, PUT | `/vaults/{id}/files/content` | Текст файла |
| POST | `/vaults/{id}/files/upload` | Файл |
| POST | `/vaults/{id}/files/folder` | Каталог |
| DELETE | `/vaults/{id}/files/item` | Удалить |
| PATCH | `/vaults/{id}/files/rename` | Переименовать |
| GET | `/vaults/{id}/notes` | Индекс заметок |
| GET | `/vaults/{id}/notes/by-title` | Заметка по заголовку |
| GET | `/vaults/{id}/backlinks` | Обратные ссылки |
| GET | `/vaults/{id}/graph` | Граф |
| GET | `/vaults/{id}/search` | Поиск, query `q` |
| POST | `/vaults/{id}/search/replace` | Замена |
| GET | `/vaults/{id}/index/status` | Свежесть индекса |
| POST | `/vaults/{id}/index/rebuild` | Пересобрать |
| GET, PUT | `/vaults/{id}/bookmarks` | Закладки |
