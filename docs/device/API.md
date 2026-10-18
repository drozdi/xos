# API — устройства

Префикс `/api/device`. Роль `ROLE_DEVICE`. Старый путь `/device/{path}` перенаправляется на эти методы.

Тело списков: `limit`, `offset`, `sortBy` (`[{ key, order }]`), `filters`. Ответ списка сопровождается заголовком `Content-Range`.

## Устройства

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/device/device/filter` | Дерево типов для селекта |
| POST | `/api/device/device/select` | Выбор устройств, с активным подразделением |
| POST | `/api/device/device/list` | Список. `filters.ou` и `filters.ou_id` отбрасываются |
| GET | `/api/device/device/{id}` | Карточка |
| POST | `/api/device/device/` | Создать |
| PUT | `/api/device/device/{id}` | Изменить |
| DELETE | `/api/device/device/{id}` | Удалить |
| GET | `/api/device/device/property/{id}` | Одно свойство устройства |
| GET | `/api/device/device/properties/{id}` | Набор свойств |
| POST | `/api/device/device/upload` | Загрузка изображения |
| POST | `/api/device/device/upload-file` | Загрузка файла |

Список с клиента: `filters.type` — id выбранного типа, `filters.accounting.discarded` — `false` или `true`. При `false` устройства без строки учёта остаются в выборке.

## Комплектующие

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/device/subDevices/filter` | Типы для селекта |
| GET | `/api/device/subDevices/form/{id}` | Поля формы |
| GET | `/api/device/subDevices/attach/{id}` | Куда можно привязать |
| GET | `/api/device/subDevices/parentAccountings/{id}` | Учёт родителя |
| POST | `/api/device/subDevices/list` | Список |
| POST | `/api/device/subDevices/select` | Выбор |
| GET | `/api/device/subDevices/{id}` | Карточка |
| POST | `/api/device/subDevices/` | Создать |
| PUT | `/api/device/subDevices/{id}` | Изменить |
| DELETE | `/api/device/subDevices/{id}` | Удалить |

## Типы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/device/types/list` | Список |
| POST | `/api/device/types/select` | Выбор |
| GET, POST | `/api/device/types/components` | Комплектующие типа |
| GET, POST | `/api/device/types/properties` | Свойства типа |
| GET | `/api/device/types/property-catalog` | Каталог свойств |
| GET | `/api/device/types/property-template/{id}` | Шаблон свойства |
| POST | `/api/device/types/` | Создать |
| GET | `/api/device/types/{id}` | Карточка |
| PUT | `/api/device/types/{id}` | Изменить |
| DELETE | `/api/device/types/{id}` | Удалить |

## Свойства и типы комплектующих

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/device/properties/list` | Список свойств |
| POST | `/api/device/properties/select` | Выбор |
| POST | `/api/device/properties/props` | Набор значений |
| POST | `/api/device/properties/` | Создать |
| GET, PUT, DELETE | `/api/device/properties/{id}` | Карточка |
| POST | `/api/device/components/list` | Типы комплектующих |
| POST | `/api/device/components/select` | Выбор |
| GET | `/api/device/components/property-catalog` | Каталог |
| GET | `/api/device/components/property-template/{id}` | Шаблон |
| POST | `/api/device/components/` | Создать |
| GET, PUT, DELETE | `/api/device/components/{id}` | Карточка |

## Программы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/device/software/list` | Список |
| POST | `/api/device/software/select` | Выбор |
| GET | `/api/device/software/filter` | Фильтр типов |
| POST | `/api/device/software/` | Создать |
| GET, PUT, DELETE | `/api/device/software/{id}` | Карточка |
| POST | `/api/device/software/type/list` | Типы программ |
| POST | `/api/device/software/type/select` | Выбор типа |
| POST | `/api/device/software/type/` | Создать тип |
| GET, HEAD, PUT, DELETE | `/api/device/software/type/{id}` | Карточка типа |

## Лицензии, ключи, учёт

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/device/license/list` | Список лицензий |
| POST | `/api/device/license/` | Создать |
| GET | `/api/device/license/{id}` | Карточка |
| PUT | `/api/device/license/{id}` | Изменить |
| DELETE | `/api/device/license/remove/{id}` | Удалить |
| POST | `/api/device/license/key/list` | Ключи |
| GET | `/api/device/license/key/{id}` | Ключ |
| PUT | `/api/device/license/key/{id}` | Изменить ключ |
| POST | `/api/device/accounting/list` | Операции учёта |
| POST | `/api/device/accounting/list/select` | Выбор учёта |
