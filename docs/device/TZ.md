# ТЗ — Device (учёт оборудования)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

CRM-модуль учёта IT-активов: устройства, комплектующие, типы, свойства, ПО, лицензии.

## 2. Пользователи и доступ

- **Claimant:** `device` + nested (`device.device`, `device.type`, …)
- **Роль:** `ROLE_DEVICE`
- Расширенные scope для устройств: `can_mod`, `can_location`, `can_write_off`, `can_repair`

## 3. Приложения (17)

**Списки:** device-devices, device-sub-devices, device-types, device-properties, device-components, device-softwares, device-software-types, device-licenses

**Карточки:** device-device, device-sub-device, device-type, device-property, device-component, device-software, device-software-type, device-license, device-license-key

## 4. Функциональные требования

### Устройство (device-device)
- Учётные поля: инв. №, накладная, даты, наименование
- Динамические свойства по типу устройства
- Комплектующие, ремонты, лицензии
- Галерея изображений, файлы (upload)

### Справочники
- Типы устройств / комплектующих / ПО
- Свойства с enum-значениями, postfix, default
- Лицензии и ключи

### Списки
- DataTable с фильтрами, server pagination
- Открытие sub-app по клику

## 5. API

**Prefix:** `/api/device/`

| Ресурс | Путь |
|--------|------|
| Устройства | `/device/device` |
| Комплектующие | `/device/components` |
| Типы | `/device/types` |
| Свойства | `/device/property` |
| ПО | `/device/software` |
| Лицензии | `/device/license` |

Upload: `POST /api/device/device/upload`, module `device` в UploadPathResolver.

## 6. Backend

```
server/src/Device/
├── Controller/
├── Entity/
└── setting.json
```

## 7. Критерии приёмки

- [x] CRUD всех сущностей с scope-проверками
- [x] Карточка устройства: вкладки, upload файлов
- [x] Связь тип → шаблон свойств
- [x] Sub-app instanceKey = entity id

## 8. Связанные документы

- [README.md](README.md)
- [TZ.md](../TZ.md) § Device
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
