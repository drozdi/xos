# IBlock — информационные блоки

Bitrix-like API инфоблоков: типы, блоки, разделы, элементы, свойства и значения свойств.

Desktop apps: группа Start Menu **«Инфоблоки»** (`iblock-*`) и **«Контент»** (`notes` / `recipes`, consumer UI).

## Доступ

- Модуль в `ProtectedAppModules` → `ROLE_IBLOCK` / `ROLE_IBLOCK_ROOT` / `ROLE_IBLOCK_ADMIN`
- Consumer **Рецепты**: модуль `recipe` → `ROLE_RECIPE`; map-access: `can_category` (плоский уровень)
- FE: `canAccessApp('iblock')` + bit scopes `iblock.type|block|section|element|property`
- Контроллеры: `#[Access('iblock.*')]` + method CRUD scopes; `ROLE_RECIPE` проходит через bridge (только блок `recipes`)

## Claimant

- **Код:** `iblock`
- **Под-claimants:** `iblock.type`, `iblock.block`, `iblock.element`, `iblock.section`, `iblock.property`
- **Рецепты:** `recipe` — `ROLE_RECIPE` = просмотр + свои рецепты (CRUD); `can_category` = правка категорий (`server/src/Recipe/setting.json`)
- Enum свойств использует `iblock.property`
- Section-property использует `iblock.section`

## Desktop apps

| App id | Start Menu | Назначение |
|--------|------------|-------------|
| `iblock-types` | да | типы |
| `iblock-type` | нет | форма типа |
| `iblock-blocks` | да | блоки |
| `iblock-block` | нет | форма блока |
| `iblock-sections` | да | разделы |
| `iblock-section` | нет | форма + filter properties |
| `iblock-elements` | да | элементы |
| `iblock-element` | нет | форма + `PROPERTY_VALUES` |
| `iblock-properties` | да | свойства |
| `iblock-property` | нет | форма + enums |
| `notes` / `note` | да / нет | каталог заметок (block `notes`) |
| `articles` … `ideas` | да / нет | content-каталоги (см. [APPS.md](../APPS.md)) |
| `leads` / `lead` | да / нет | CRM-мини (block `leads`) |
| `recipes` / `recipe` | да / нет | каталог рецептов (block `recipes`) |
| `recipe-categories` | да | категории recipes — только с `can_category` |

Списки: простой фильтр тип (блоки) / тип→инфоблок (элементы, разделы, свойства). Детальные фильтры — в task-specific apps.

Seed content: `php bin/console xos:seed-project` → type `content`, blocks `notes`/`recipes`. FE: `features/iblock-content/`.

Клиент: `iblockApi.ts`, `features/iblock/iblockAccess.ts`, `useIblockTypeBlockFilter.ts`.

## Backend

```
server/src/IBlock/
├── Controller/     # type, block, section, section-property, element, property, property-enum
├── Entity/         # Type, Block, Section, SectionElement, SectionProperty, Element, Property, Property\Enum, ElementPropertyValue
├── Repository/
├── Service/        # Bitrix-like managers (+ SectionElementManager, SectionPropertyManager)
└── setting.json
```

**API prefix:** `/api/iblock/`

ТЗ: [TZ.md](TZ.md) · каталог apps: [APPS.md](../APPS.md)

Демо в PKB/Board: `php bin/console xos:seed-project --force` → заметки `Notes/Apps/IBlock*` + карточка «IBlock».

## Модель

```
Type → Block (section_mode: bind|tree|filter|bind_filter; preview/detail_image → main_file)
         → Section (element_filter JSON; preview/detail_image → main_file)
         → Element (section_id primary + SectionElement M:N; preview/detail_image → main_file)
         ↘ Property (block_id required, link_iblock_id for E/G)
                   field_type: S|N|F|L|E|G
Element → ElementPropertyValue
  S/N → value/value_s/value_n
  L → valueL M2M enum
  F → value_file_id → main_file
  E → value_element_id (block = link_iblock_id)
  G → value_section_id (block = link_iblock_id)
Section → SectionProperty (smart_filter UI settings)
Section ↔ Element via iblock_section_element (как b_iblock_section_element)
```

## Managers

Фасады в `IBlock\Service\`: `getById`, `getList`, `add`, `update`, `delete`.

`ElementManager` принимает `PROPERTY_VALUES` / `properties` / `section_ids`, сериализует их в detail и фильтрует по `PROPERTY_{CODE}` / `active_now` / `section_id` с учётом `block.section_mode`.

`SectionElementManager` — sync M:N, `resolveInheritedFilter`, subtree ids.

`SectionPropertyManager` + `GET /api/iblock/section/{id}/filter` — настройки smart filter для UI.

Серверный модуль переиспользуемый: managers не знают о desktop UI.
