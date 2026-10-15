# API — устройства

Префикс `/api/device`. Роль `ROLE_DEVICE`.

Общий шаблон справочника: `POST /list`, `POST /` создать, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`. У типов дополнительно выборки `select`, `components`, `properties`.

| Префикс | Сущность |
|---------|----------|
| `/api/device/device` | Устройства, фильтр, учётные поля |
| `/api/device/subDevices` | Комплектующие |
| `/api/device/types` | Типы |
| `/api/device/properties` | Свойства |
| `/api/device/components` | Типы комплектующих |
| `/api/device/software` | Программы |
| `/api/device/software/type` | Типы программ |
| `/api/device/license` | Лицензии |
| `/api/device/license/key` | Ключи |
| `/api/device/accounting` | Операции учёта |

Старый путь `/device/...` перенаправляется на эти методы.
