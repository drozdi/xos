# API — проводник

Префикс `/api/explorer`. Роль `ROLE_EXPLORER`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/config` | Диски, типы файлов, чем открывать |
| GET | `/list` | Каталог, query `path`, `sortBy`, `sortDir` |
| GET | `/tree` | Дерево, query `path`, `depth` |
| GET | `/info` | Метаданные пути |
| GET | `/content` | Содержимое для просмотра |
| GET | `/download` | Скачивание |
| POST | `/upload` | Загрузка в каталог |
| PUT | `/content` | Записать текст файла |
| POST | `/folder` | Создать каталог |
| PATCH | `/rename` | Переименовать |
| POST | `/copy`, `/move` | Копировать или перенести |
| DELETE | `/item` | Удалить в корзину |
| GET, POST | `/disks` | Список и создание диска |
| DELETE | `/disks/{id}` | Удалить личный диск |
| GET | `/trash` | Корзина |
| POST | `/trash/restore` | Вернуть |
| DELETE | `/trash` | Очистить |
| GET | `/archive/list` | Содержимое архива |
| POST | `/archive/pack`, `/archive/unpack` | Собрать или распаковать |
