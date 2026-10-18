# Устройства

Учёт техники: карточка устройства, комплектующие, типы, свойства, программы, лицензии и ключи.

Доступ: `ROLE_DEVICE`. Код: `server/src/Device`, `client/src/apps/device-*`, `client/src/features/device`.

## Приложения

| ID | Экран |
|----|--------|
| device-devices | Список устройств выбранного типа |
| device-device | Карточка устройства |
| device-sub-devices / device-sub-device | Комплектующие и карточка |
| device-types / device-type | Типы устройств |
| device-properties / device-property | Свойства |
| device-components / device-component | Типы комплектующих |
| device-software / device-software-type | Программы и их типы |
| device-licenses / device-license / device-license-key | Лицензии и ключи |

Карточки открываются из списков и не дублируют пункт в «Пуске», если манифест скрывает список.

## Список устройств

При открытии выбирается первый тип из `GET /api/device/device/filter`, как в комплектующих. Пункта «Все типы» нет. Пока тип не выбран, список не запрашивается.

Запрос `POST /api/device/device/list` не фильтрует по подразделению: `ou` и `ou_id` отбрасываются. Списанные скрыты, пока не включён флажок «Списан». Флаг уходит как `filters.accounting.discarded`. Значение `false` оставляет устройства без строки учёта.

В строке списка: id, название, код, место, инвентарный номер.

## Подразделение

Выбор пользователей `POST /api/device/device/select` по-прежнему учитывает активное подразделение. Список — нет.

См. [TZ.md](TZ.md), [API.md](API.md).
