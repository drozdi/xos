# Device — учёт оборудования

CRM-модуль учёта устройств, комплектующих, ПО, лицензий и справочников.

## Claimant

- **Код:** `device`
- **Под-claimants:** `device.device`, `device.subDevice`, `device.type`, `device.property`, `device.component`, `device.software`, `device.software.type`, `device.license`
- **Роль:** `ROLE_DEVICE`

## Приложения

### Списки (regular)

| ID | Сущность |
|----|----------|
| device-devices | Устройства |
| device-sub-devices | Комплектующие |
| device-types | Типы устройств |
| device-properties | Свойства (справочник) |
| device-components | Типы комплектующих |
| device-softwares | Программы |
| device-software-types | Типы программ |
| device-licenses | Лицензии |

### Карточки (sub-app)

| ID | Открывается из |
|----|----------------|
| device-device | device-devices |
| device-sub-device | device-sub-devices |
| device-type | device-types |
| device-property | device-properties |
| device-component | device-components |
| device-software | device-softwares |
| device-software-type | device-software-types |
| device-license | device-licenses |
| device-license-key | device-license (вкладка ключей) |

## Backend

```
server/src/Device/
├── Controller/
│   ├── DeviceController.php      # /api/device/device
│   ├── ComponentController.php   # комплектующие
│   ├── LicenseController.php
│   ├── SoftwareController.php
│   └── …
├── Entity/
└── setting.json
```

**API prefix:** `/api/device/`

Загрузка файлов/изображений: `POST /api/device/device/upload`, модуль `device` в `UploadPathResolver`.

## Frontend

```
client/src/apps/device-*/
client/src/features/device/       # DeviceAccountingFields, editors, gallery
```

Утилиты sub-app: `deviceAppUtils.ts`.

## Карточка устройства (device-device)

Вкладки: общие данные, свойства, комплектующие, ремонты, лицензии, изображения, файлы.

Дополнительные scope: `can_mod`, `can_location`, `can_write_off`, `can_repair` — см. `setting.json`.

## Документы

- [TZ.md](TZ.md) — техническое задание
