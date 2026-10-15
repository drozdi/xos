# Assets — склад, автопарк, договоры

Учёт складских позиций, транспорта, контрагентов, договоров, помещений и ПО.

## Claimant

- **Код:** `assets`
- **Под-claimants:** `assets.warehouse`, `assets.fleet`, `assets.party`, `assets.contract`, `assets.room`, `assets.software`
- **Роль:** `ROLE_ASSETS`

## Приложения

### Списки (regular)

| ID | Сущность |
|----|----------|
| assets-warehouse | Склад |
| assets-fleet | Автопарк |
| assets-parties | Контрагенты |
| assets-contracts | Договоры |
| assets-rooms | Помещения |
| assets-software | ПО |

### Карточки (sub-app)

| ID | Открывается из |
|----|----------------|
| assets-warehouse-item | assets-warehouse |
| assets-fleet-vehicle | assets-fleet |
| assets-party | assets-parties |
| assets-contract | assets-contracts |
| assets-room | assets-rooms |
| assets-software-item | assets-software |

## Backend

```
server/src/Assets/
```

**API prefix:** `/api/assets/*`

## Frontend

```
client/src/apps/assets-*/
client/src/features/assets/   # AssetsCatalog*
```

## Документы

- [APPS.md](../APPS.md)
