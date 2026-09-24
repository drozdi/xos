# IBlock API

**Prefix:** `/api/iblock/`  
**Auth:** JWT + `#[Access]` claimants (`iblock.*`)

Ошибки валидации — плоский объект `{ "field": "message" }` (legacy IBlock).

## Ресурсы

| Resource | Claimant | Endpoints |
|----------|----------|-----------|
| `/api/iblock/type` | `iblock.type` | CRUD + `POST /list` |
| `/api/iblock/block` | `iblock.block` | CRUD + `POST /list` |
| `/api/iblock/section` | `iblock.section` | CRUD + `POST /list` + `GET /{id}/filter` + `POST /{id}/elements` |
| `/api/iblock/section-property` | `iblock.section` | CRUD + `POST /list` |
| `/api/iblock/element` | `iblock.element` | CRUD + `POST /list` |
| `/api/iblock/property` | `iblock.property` | CRUD + `POST /list` |
| `/api/iblock/property-enum` | `iblock.property` | CRUD + `POST /list` |

### CRUD pattern

| Method | Path | Право | Ответ |
|--------|------|-------|-------|
| `POST` | `/list` | `can_read` | массив + `Content-Range` |
| `GET` | `/{id}` | `can_read` | detail |
| `POST` | `/` | `can_create` | id (201) |
| `PUT` | `/{id}` | `can_update` | id |
| `DELETE` | `/{id}` | `can_delete` | `{id, code, name}` (или `{id, section_id, property_id}` для section-property) |

### List body

```json
{
  "t": "list",
  "limit": 10,
  "offset": 1,
  "sortBy": [{"key": "sort", "order": "ASC"}],
  "filters": {}
}
```

`t: "select"` → `[{value, label}]`.

## Уникальность `code`

| Сущность | Unique |
|----------|--------|
| Block | `(type_id, code)` |
| Section | `(block_id, code)` |
| Element | `(block_id, code)` |
| Property | `(block_id, code)` |

Type — глобальный `code` UNIQUE (без изменений).

## Property

Поля: `code`, `name`, `field_type`, `multiple`, `block_id` (required), `link_iblock_id`, …

**`field_type` (обязательно один из):**

| Код | Тип | Хранение значения | Настройки |
|-----|-----|-------------------|-----------|
| `S` | строка | `value` / `value_s` | — |
| `N` | число | `value_n` | — |
| `F` | файл | FK `value_file_id` → `main_file` | upload `POST /api/main/file/upload` `module=iblock`; **`file_type`**: пусто=любой, `image`=картинки, иначе расширения `jpg,png` или mime `image/*` |
| `L` | список | M2M `valueL` → enum | enums через `/property-enum` |
| `E` | привязка к элементу | FK `value_element_id` | **`link_iblock_id` required** — только элементы этого блока |
| `G` | привязка к разделу | FK `value_section_id` | **`link_iblock_id` required** — только разделы этого блока |

Фильтр списка: `block_id`, `code`, `name`, `active`.

## Property enum

Поля: `property_id` (required), `code`, `name`, `sort`, `default`.

Фильтр: `property_id`, `code`, `name`.

## Section property

Поля: `section_id`, `property_id` (required), `block_id` (если пусто — из `section.block`), `smart_filter`, `display_type` (default `A`), `display_expanded`, `sort`, `active`.

Фильтр списка: `section_id`, `block_id`, `property_id`, `smart_filter`, `active`.

### Section filter UI

`GET /api/iblock/section/{id}/filter` — активные section-property с `smart_filter=true`:

```json
[
  {
    "id": 1,
    "property_id": 5,
    "code": "COLOR",
    "name": "Color",
    "field_type": "L",
    "display_type": "A",
    "display_expanded": false,
    "sort": 100
  }
]
```

## Element + PROPERTY_VALUES

Хранение: `value` / `value_s` / `value_n` + M2M `valueL` + FK `value_file` / `value_element` / `value_section`.

- `L`: одна строка на свойство, enum’ы в `valueL` (в т.ч. при `multiple`)
- `S`/`N`: одна строка; при `multiple` — по строке на значение
- `F`/`E`/`G`: при `multiple` — по строке на значение; E/G валидируются по `property.link_iblock_id`

### Ownership / share

- Element и Section: `created_by`, `updated_by` (user ref)
- List/detail element: `is_owner`, `can_write`, `is_shared`; detail владельца — `shares[]`
- Filter list: `accessible_for=<userId>` → свои (`created_by`) + shared + legacy без владельца
- `POST /api/iblock/element/{id}/share` `{ "email": "..." }` — view-only
- `DELETE /api/iblock/element/{id}/share/{userId}`

### Create / update

```json
{
  "code": "item_1",
  "name": "Item",
  "block_id": 1,
  "PROPERTY_VALUES": {
    "COLOR": ["RED", "BLUE"],
    "WEIGHT": 12.5,
    "TITLE": "Hello",
    "DOC": 42,
    "RELATED": 15,
    "FOLDER": 3
  }
}
```

Алиас: `properties`. Для `L` — id enum или `code` (или массив). Для `F`/`E`/`G` — id (или `{ "id": N }`).

Разделы (Bitrix-like M:N, аналог `b_iblock_section_element`):

- `section_id` — основной раздел
- `section_ids: number[]` (алиасы `sections`, `IBLOCK_SECTION`) — полная замена обычных привязок; первый = primary
- detail/list возвращают `section_ids`

### Section mode (`block.section_mode`)

При фильтре `section_id` список элементов зависит от режима блока:

| Режим | Поведение |
|-------|-----------|
| `bind` | только `iblock_section_element` для этого раздела |
| `tree` (default) | bind + потомки раздела |
| `filter` | элементы по **inherited** `section.element_filter` (root→leaf, child wins) |
| `bind_filter` | объединение `tree` ∪ `filter` |

`POST /api/iblock/section/{id}/elements` — list с `filters.section_id = id` и учётом mode.

Поля section detail: `element_filter`, `inherited_element_filter`.
Block detail: `section_mode`.

### Images (`preview_image` / `detail_image`)

На **Block**, **Element**, **Section** — FK на `main_file`:

| Поле API | Колонка | Описание |
|----------|---------|----------|
| `preview_image_id` / `preview_image` | `preview_image_id` | картинка анонса |
| `detail_image_id` / `detail_image` | `detail_image_id` | детальная картинка |

Write: id или `{ "id": N }` (или `null` чтобы сбросить).  
Read: `preview_image` / `detail_image` = `{ id, name, src } | null`, плюс `*_id`.

Upload: `POST /api/main/file/upload` `module=iblock`.

При update для переданных кодов свойства — clear + rewrite строк `iblock_element_property`.

### Detail read

`F` → `{ id, name, src }`; `E`/`G` → `{ id, name, code }`; `L` → id(s); `S`/`N` — скаляр.

### Filters

| Ключ | Поведение |
|------|-----------|
| `PROPERTY_{CODE}` | eq по `value` / `value_s` / `value_n` / enum id (`valueL`) / FK file|element|section; если значение содержит `%` — `LIKE` по `value`/`value_s` |
| `active_now` | `true` → active=1 и окно active_from/active_to относительно now |
| `block_id`, `section_id`, `active`, `code`, `name` | обычные фильтры |

## Managers

`IBlock\Service\*Manager`: Bitrix-like `getById` / `getList($order, $filter, $limit, $offset)` / `add` / `update` / `delete`.
