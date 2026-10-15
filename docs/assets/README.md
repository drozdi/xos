# Склад и имущество

Склад, автопарк, контрагенты, договоры, помещения и программы.

Доступ: `ROLE_ASSETS`. Списки учитывают активное подразделение.

## Приложения

| Список | Карточка |
|--------|----------|
| assets-warehouse | assets-warehouse-item |
| assets-fleet | assets-fleet-vehicle |
| assets-parties | assets-party |
| assets-contracts | assets-contract |
| assets-rooms | assets-room |
| assets-software | assets-software-item |

Связь с устройством задаётся на карточке устройства, не здесь.

Код: `server/src/Assets`, `client/src/apps/assets-*`.

См. [TZ.md](TZ.md), [API.md](API.md).
