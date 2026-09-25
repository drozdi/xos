# IBlock — руководство для разработчиков

> Модель близка к [Bitrix IBlock D7](https://dev.1c-bitrix.ru/api_help/iblock/iblock_d7.php) и [структуре таблиц](https://dev.1c-bitrix.ru/api_help/iblock/fields.php).  
> XOS реализует ядро CRUD + свойства + разделы↔элементы; facet index, RSS, workflow, права `b_iblock_section_right` — **вне scope**.

Связанные файлы: [README](README.md) · [API](API.md) · [TZ](TZ.md) · [DATABASE_SCHEMA](../DATABASE_SCHEMA.md#iblock--информационные-блоки)

---

## 1. Назначение

Инфоблоки — универсальное хранилище структурированных сущностей:

```
Type → Block → Section* / Element* / Property*
                Element ↔ Section (M:N)
                Element → PROPERTY_VALUES
```

Типичные сценарии: каталог, новости, справочники CRM, справочники Device→IBlock (отдельный план seed).

Серверный модуль **не зависит** от desktop UI: контроллеры + managers переиспользуемы.

---

## 2. Соответствие Bitrix

| Bitrix | XOS | Примечание |
|--------|-----|------------|
| `b_iblock_type` | `iblock_type` (`Type`) | без lang-таблицы; `sections` bool |
| `b_iblock` | `iblock_block` (`Block`) | `type_id` FK; `section_mode`; unique `(type_id, code)` |
| `b_iblock_section` | `iblock_section` (`Section`) | дерево `parent_id`; `element_filter` JSON; unique `(block_id, code)` |
| `b_iblock_element` | `iblock_element` (`Element`) | `section_id` = основной раздел; unique `(block_id, code)` |
| `b_iblock_section_element` | `iblock_section_element` | M:N + `additional_property_id` (0 = обычная привязка) |
| `b_iblock_property` | `iblock_property` | только `block_id` (не Type); unique `(block_id, code)` |
| `b_iblock_property_enum` | `iblock_property_enum` | unique `(property_id, code)` |
| значения свойств | `iblock_element_property` (+ enum M2M) | typed: S/N/F/L/E/G |
| `b_iblock_section_property` | `iblock_section_property` | smart filter UI |
| `IBLOCK_SECTION_ID` | `Element.section_id` | primary |
| `IBLOCK_SECTION` / multi | `section_ids[]` | sync M:N |
| D7 `getList` / `add` / `update` / `delete` | `*Manager` | тот же стиль API |

Не реализовано (осознанно): `LEFT_MARGIN`/`RIGHT_MARGIN`, `PROPERTY_INDEX`, RSS, workflow/bizproc, site LID, URL templates, права на раздел, полный SECTION_CHOOSER.

---

## 3. Модель данных

### 3.1 Type (`iblock_type`)

Группировка блоков. Поля: `code` (global UNIQUE), `name`, `description`, `sort`, `active`, `sections`, `active_from`/`active_to`, `parent_id`.

### 3.2 Block (`iblock_block`)

Инфоблок. Ключевые поля:

| Поле | Смысл |
|------|--------|
| `type_id` | тип; unique вместе с `code` |
| `sections` | разделы включены |
| `property` | свойства включены |
| `section_mode` | `bind` \| `tree` \| `filter` \| `bind_filter` (default `tree`) |

### 3.3 Section (`iblock_section`)

Дерево внутри блока (`parent_id`, `level`).

| Поле | Смысл |
|------|--------|
| `element_filter` | JSON критериев `{ "PROPERTY_COLOR": "blue", "active": true, … }` |
| `inherited_element_filter` | только в API detail — merge root→leaf, **child wins** |

### 3.4 Element (`iblock_element`)

| Поле | Смысл |
|------|--------|
| `section_id` | основной раздел (Bitrix `IBLOCK_SECTION_ID`) |
| `section_ids` | все обычные привязки (из `section_element`) |
| `PROPERTY_VALUES` | map code → value |

### 3.5 SectionElement (`iblock_section_element`)

Аналог `b_iblock_section_element`:

- UNIQUE `(section_id, element_id, additional_property_id)`
- `additional_property_id = 0` — обычная привязка
- Backfill: при миграции строки из `element.section_id`

### 3.6 Property (`iblock_property`)

Принадлежит **только** блоку (`block_id` NOT NULL).

| `field_type` | Хранение | Примечание |
|--------------|----------|------------|
| `S` | `value` / `value_s` | строка |
| `N` | `value_n` | число |
| `F` | `value_file_id` → `main_file` | upload `module=iblock` |
| `L` | M2M `valueL` → enum | `/property-enum` |
| `E` | `value_element_id` | нужен `link_iblock_id` |
| `G` | `value_section_id` | нужен `link_iblock_id` |

`multiple`: для L — несколько enum в одной строке; для S/N/F/E/G — несколько строк значений.

---

## 4. Режимы разделов (`section_mode`)

При списке элементов с `filters.section_id`:

| Режим | Логика |
|-------|--------|
| `bind` | EXISTS в `section_element` только для этого раздела |
| `tree` | bind + все потомки раздела (BFS) |
| `filter` | элементы по **inherited** `element_filter` |
| `bind_filter` | `tree` ∪ `filter` |

Реализация: `ElementManager` + `SectionElementManager::resolveInheritedFilter` / `collectSubtreeSectionIds`.

Удобный endpoint: `POST /api/iblock/section/{id}/elements` (подставляет `section_id`).

`GET /api/iblock/section/{id}/filter` — **только** smart-filter UI (массив section-property); семантика не менялась. Inherited filter — в **detail** раздела.

---

## 5. Managers (Bitrix-like)

Namespace `IBlock\Service\`:

| Manager | Сущность |
|---------|----------|
| `TypeManager` | Type |
| `BlockManager` | Block |
| `SectionManager` | Section |
| `ElementManager` | Element + PROPERTY_VALUES + section modes |
| `PropertyManager` | Property |
| `PropertyEnumManager` | Enum |
| `SectionPropertyManager` | section↔property + filter UI |
| `SectionElementManager` | M:N sync, inheritance |

Общий контракт (`AbstractIBlockManager`):

```php
getById(int $id): ?array
getList(array $order, array $filter, ?int $limit, ?int $offset): array
count(array $filter): int
add(array $fields): int
update(int $id, array $fields): void
delete(int $id): void
```

### ElementManager — важные поля входа

```json
{
  "code": "sku_1",
  "name": "Товар",
  "block_id": 1,
  "section_id": 10,
  "section_ids": [10, 11],
  "PROPERTY_VALUES": {
    "COLOR": "RED",
    "WEIGHT": 1.5,
    "DOC": 42,
    "RELATED": { "id": 15 },
    "FOLDER": 3
  }
}
```

Алиасы: `properties`; разделы — `sections` / `IBLOCK_SECTION`.

- `section_ids` — полная замена обычных binds; первый = primary `section_id`
- только `section_id` — обновляет primary + `ensurePrimaryLink`
- update по переданным кодам PROPERTY — clear + rewrite

Фильтры списка: `block_id`, `section_id` (+ mode), `active`, `active_now`, `code`, `name`, `PROPERTY_{CODE}` (eq / LIKE с `%`).

---

## 6. REST API

Prefix: `/api/iblock/`. Auth: JWT + `#[Access('iblock.*')]`.

| Resource | Claimant |
|----------|----------|
| `/type` | `iblock.type` |
| `/block` | `iblock.block` |
| `/section` (+ `/filter`, `/elements`) | `iblock.section` |
| `/section-property` | `iblock.section` |
| `/element` | `iblock.element` |
| `/property` | `iblock.property` |
| `/property-enum` | `iblock.property` |

CRUD: `POST /list`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`.

List body:

```json
{
  "t": "list",
  "limit": 50,
  "offset": 1,
  "sortBy": [{ "key": "sort", "order": "ASC" }],
  "filters": { "block_id": 1 }
}
```

`t: "select"` → `[{ value, label }]`. Пагинация: `Content-Range`.

Подробности полей и примеров: [API.md](API.md).

---

## 7. Доступ и desktop apps

### Backend

- `ProtectedAppModules` → `ROLE_IBLOCK` / `ROLE_IBLOCK_ROOT` / `ROLE_IBLOCK_ADMIN`
- Claimants в `setting.json`, sync: `php bin/console main:claimant:sync`

### Frontend

- `canAccessApp('iblock')` + scopes `iblock.type|block|section|element|property`
- Apps Start Menu «Инфоблоки»:

| List | Detail |
|------|--------|
| `iblock-types` | `iblock-type` |
| `iblock-blocks` | `iblock-block` |
| `iblock-sections` | `iblock-section` |
| `iblock-elements` | `iblock-element` |
| `iblock-properties` | `iblock-property` |

Списки: фильтр **тип** (блоки) / **тип → инфоблок** (элементы, разделы, свойства) — `useIblockTypeBlockFilter`. Детальные фильтры — в task-specific apps.

Клиент API: `client/src/core/api/endpoints/iblockApi.ts`.

---

## 8. Миграции (важные)

| Version | Содержание |
|---------|------------|
| `…15120000`+ | базовые таблицы iblock |
| `…15150000` | Property только Block; unique `(block_id, code)` |
| `…18120000` | `section_element`, `element_filter`, `section_mode` |
| `…18130000` | составные unique Block/Section/Element |

---

## 9. Тесты

- `server/tests/Controller/IBlockApiTest.php` — CRUD, PROPERTY_VALUES, section-property filter
- `server/tests/IBlock/SectionElementInheritanceTest.php` — inheritance + subtree (unit)

Запуск (пример OSPanel):

```bash
C:\OSPanel\modules\PHP-8.3\php.exe vendor\bin\phpunit tests\IBlock\SectionElementInheritanceTest.php
```

---

## 10. Как расширять

1. **Новый тип свойства** — `Property.field_type` + колонка/FK в `ElementPropertyValue` + ветки в `ElementManager` (sync/serialize/filter) + Zod на FE.
2. **Task-specific UI** — отдельное app id; переиспользовать `iblockApi` и managers; не раздувать общие list/detail.
3. **Seed данных** — `xos:seed-project` создаёт type `content` + blocks `notes` / `recipes` (consumer apps Заметки/Рецепты). Device→IBlock — отдельный план.

### 10.1 Content apps (Notes / Recipes)

Consumer UI поверх IBlock (без нового Symfony-модуля):

| App | Block code | Особенности |
|-----|------------|-------------|
| `notes` / `note` | `notes` | view-first + share; `COVER` F multiple + `file_type=image`; `TAGS` S multiple; `detail_text` markdown |
| `recipes` / `recipe` | `recipes` | view-first + share; `COVER` F multiple + `file_type=image`; `ROLE_RECIPE` = свои рецепты (CRUD) + просмотр каталога; `can_category` = правка категорий |

Shared FE: `client/src/features/iblock-content/` (`IblockMarkdownEditor`, upload → `![alt](src)` через `module=iblock`, `NoteView` / `RecipeView`, share modal).

**Идеи следующих content-apps:** [APP_IDEAS.md](../APP_IDEAS.md) (§1 IBlock consumer).

**Владение и share (элементы):**

- `created_by` / `updated_by` на Element и Section
- `iblock_element_share` — только `permission=read`
- List filter `accessible_for=<userId>`: свои + расшаренные
- API: `POST /api/iblock/element/{id}/share` `{ email }`, `DELETE .../share/{userId}`
- Detail/list: `is_owner`, `can_write`, `is_shared`; у владельца в detail — `shares[]`
- Рецепт открывается в просмотре; кнопка правки и «Поделиться» — только владельцу

Список элементов отдаёт `preview_text` + `cover` (свойство `COVER`) для каталогов.

**Картинки сущностей:** у Block / Element / Section поля `preview_image` и `detail_image` (FK → `main_file`; API: `*_id` + объект `{id,name,src}`).

```bash
php bin/console xos:seed-project
```

---

## 11. PKB / Board

Демо-документация модуля живёт в vault seed и на доске XOS:

```bash
php bin/console xos:seed-project --force
```

Заметки: `Notes/Apps/IBlock.md` и `Notes/Apps/IBlock/*`.  
Карточка модуля «IBlock» в списке «Модули» связана с vault (`pkb_vault_id` + `pkb_note_path`).
