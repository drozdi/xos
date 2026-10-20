# API — проводник

Префикс `/api/explorer`.

## Обзор

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/explorer/config` | Настройки клиента |
| GET | `/api/explorer/list` | Содержимое папки |
| GET | `/api/explorer/tree` | Дерево |
| GET | `/api/explorer/info` | Метаданные пути |
| GET | `/api/explorer/download` | Скачать файл |
| GET | `/api/explorer/content` | Прочитать содержимое |
| PUT | `/api/explorer/content` | Записать содержимое |

## Диски

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/explorer/disks` | Список дисков |
| POST | `/api/explorer/disks` | Создать диск |
| DELETE | `/api/explorer/disks/{id}` | Удалить диск |

### POST `/api/explorer/disks`

Общие поля: `code`, `label`, `adapter`.

- `local` / `local_readonly` — обязателен `root` (абсолютный путь на сервере).
- `yandex_disk` — обязателен `oauthToken`; опционально `rootPath` (по умолчанию `disk:/`). В ответе `config` содержит `tokenHint` и `rootPath`, без `accessToken`.

Коды `home`, `img`, `uploads` зарезервированы.

## Операции

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/explorer/folder` | Новая папка |
| PATCH | `/api/explorer/rename` | Переименовать |
| POST | `/api/explorer/copy` | Копировать |
| POST | `/api/explorer/move` | Переместить |
| DELETE | `/api/explorer/item` | Удалить в корзину |
| POST | `/api/explorer/upload` | Загрузить файл |

## Корзина и архивы

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/explorer/trash` | Список корзины |
| POST | `/api/explorer/trash/restore` | Восстановить |
| DELETE | `/api/explorer/trash` | Очистить корзину |
| GET | `/api/explorer/archive/list` | Состав архива |
| POST | `/api/explorer/archive/pack` | Упаковать |
| POST | `/api/explorer/archive/unpack` | Распаковать |
