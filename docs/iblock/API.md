# API — инфоблоки

Роль `ROLE_IBLOCK`. Списки — `POST /list`. Карточка — `GET /{id}`, создание `POST /`, правка `PUT /{id}`, удаление `DELETE /{id}`.

| Префикс | Сущность |
|---------|----------|
| `/api/iblock/type` | Типы |
| `/api/iblock/block` | Блоки |
| `/api/iblock/section` | Разделы |
| `/api/iblock/property` | Свойства |
| `/api/iblock/property-enum` | Значения списка |
| `/api/iblock/section-property` | Свойства фильтра раздела |
| `/api/iblock/element` | Элементы |

Дополнительно у раздела:

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/iblock/section/{id}/filter` | Свойства умного фильтра |
| POST | `/api/iblock/section/{id}/elements` | Элементы раздела |

У элемента:

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/iblock/element/{id}/share` | Открыть пользователю |
| DELETE | `/api/iblock/element/{id}/share/{userId}` | Закрыть |

Файлы свойств грузятся как `module=iblock`.
