# API — инфоблоки

Префикс `/api/iblock`. Роль `ROLE_IBLOCK`. Списки — `POST .../list` с `limit`, `offset`, `sortBy`, `filters`. Карточка поддерживает `HEAD` там же, где `GET`.

Контент-приложения ходят в эти методы. Отдельного `/api/content` нет.

## Тип и блок

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/iblock/type/list` | Типы |
| POST | `/api/iblock/type/` | Создать |
| GET, HEAD | `/api/iblock/type/{id}` | Карточка |
| PUT | `/api/iblock/type/{id}` | Изменить |
| DELETE | `/api/iblock/type/{id}` | Удалить |
| POST | `/api/iblock/block/list` | Блоки |
| POST | `/api/iblock/block/` | Создать |
| GET, HEAD | `/api/iblock/block/{id}` | Карточка |
| PUT | `/api/iblock/block/{id}` | Изменить |
| DELETE | `/api/iblock/block/{id}` | Удалить |

## Раздел

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/iblock/section/list` | Разделы |
| POST | `/api/iblock/section/` | Создать |
| GET, HEAD | `/api/iblock/section/{id}` | Карточка |
| PUT | `/api/iblock/section/{id}` | Изменить |
| DELETE | `/api/iblock/section/{id}` | Удалить |
| GET, HEAD | `/api/iblock/section/{id}/filter` | Фильтр раздела |
| POST | `/api/iblock/section/{id}/elements` | Элементы раздела |
| POST | `/api/iblock/section-property/list` | Свойства раздела |
| POST | `/api/iblock/section-property/` | Создать |
| GET, HEAD | `/api/iblock/section-property/{id}` | Карточка |
| PUT | `/api/iblock/section-property/{id}` | Изменить |
| DELETE | `/api/iblock/section-property/{id}` | Удалить |

## Свойство и список значений

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/iblock/property/list` | Свойства |
| POST | `/api/iblock/property/` | Создать |
| GET, HEAD | `/api/iblock/property/{id}` | Карточка |
| PUT | `/api/iblock/property/{id}` | Изменить |
| DELETE | `/api/iblock/property/{id}` | Удалить |
| POST | `/api/iblock/property-enum/list` | Значения |
| POST | `/api/iblock/property-enum/` | Создать |
| GET, HEAD | `/api/iblock/property-enum/{id}` | Карточка |
| PUT | `/api/iblock/property-enum/{id}` | Изменить |
| DELETE | `/api/iblock/property-enum/{id}` | Удалить |

## Элемент

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/iblock/element/list` | Список |
| POST | `/api/iblock/element/` | Создать |
| GET, HEAD | `/api/iblock/element/{id}` | Карточка |
| PUT | `/api/iblock/element/{id}` | Изменить |
| DELETE | `/api/iblock/element/{id}` | Удалить |
| POST | `/api/iblock/element/{id}/share` | Открыть пользователю |
| DELETE | `/api/iblock/element/{id}/share/{userId}` | Закрыть доступ |
