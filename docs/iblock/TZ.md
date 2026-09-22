# ТЗ — IBlock (информационные блоки)

> Версия: 1.0 · Статус: **реализовано**

## 1. Назначение

Гибкое хранение структурированных данных по модели Bitrix Infoblock: тип → инфоблок → разделы/элементы → свойства (в т.ч. списки с enum) → значения свойств элемента.

## 2. Доступ

| Claimant | Назначение |
|----------|------------|
| `iblock.type` | Типы |
| `iblock.block` | Блоки |
| `iblock.section` | Разделы |
| `iblock.element` | Элементы |
| `iblock.property` | Свойства и enum |

Права: `can_create`, `can_read`, `can_update`, `can_delete`.

Desktop-app и claimant для enum отдельно **не** требуются.

## 3. Функциональные требования

### Сущности
- CRUD Type, Block, Section, Property, PropertyEnum, Element
- Property связан **только** с Block (`block_id` required); связи с Type нет
- Element хранит `ElementPropertyValue` (cascade persist/remove, orphanRemoval)

### Element PROPERTY_VALUES
- Приём `PROPERTY_VALUES` / `properties` на create/update: `{CODE: value|value[]}`
- Типы: `S`/`N`/`F`/`L`/`E`/`G`
- `L` — резолв enum по id или code
- `F` — id `main_file` (upload module `iblock`)
- `E`/`G` — id element/section только из `link_iblock_id`
- Сериализация в detail; фильтр `PROPERTY_{CODE}` (в т.ч. по FK)
- Фильтр `active_now`

### Managers
Фасады `IBlock\Service\*Manager` с API Bitrix-style.

## 4. API

См. [API.md](API.md). Prefix: `/api/iblock/`.

## 5. Backend

```
server/src/IBlock/
├── Controller/
├── Entity/
├── Repository/
├── Service/
└── setting.json
```

Миграция: `Version20260915120000` — `iblock_property.block_id`, таблица `iblock_element_property`.

## 6. Критерии приёмки

- [x] Property ↔ Block, Element ↔ propertyValues
- [x] Managers для всех сущностей
- [x] Element/Property/PropertyEnum контроллеры через managers + PROPERTY_VALUES
- [x] Фильтры `PROPERTY_*` и `active_now`
- [x] Тест `testElementPropertyValuesAndFilter`
- [x] Документация `docs/iblock/`
- [x] Desktop apps + `ROLE_IBLOCK` (`ProtectedAppModules`)
- [x] Типы свойств S/N/F/L/E/G + `link_iblock_id` + FK file/element/section
- [x] Property только через Block (`block_id` required; без Type)
- [x] M:N `section_element`, `section_mode`, `element_filter` + inheritance
- [x] Составные unique code; list filters type→block
- [x] Developer guide + seed PKB/Board

## 7. Связанные документы

- [README.md](README.md)
- [API.md](API.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [../API_SPEC.md](../API_SPEC.md)
- [../DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
- Bitrix: [fields](https://dev.1c-bitrix.ru/api_help/iblock/fields.php), [D7](https://dev.1c-bitrix.ru/api_help/iblock/iblock_d7.php)
