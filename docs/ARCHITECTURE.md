# Архитектура xos

## Обзор

Монорепозиторий: Symfony 7 (API) + React 19 (desktop-shell клиент).

| Слой | Путь | Назначение |
|------|------|------------|
| App | `server/src/App/` | Kernel, JWT, общие subscribers, HTTP-утилиты |
| Main | `server/src/Main/` | Пользователи, OU, файлы, настройки |
| Device | `server/src/Device/` | Учёт оборудования |
| IBlock | `server/src/IBlock/` | Инфоблоки |
| IncCom | `server/src/IncCom/` | Учёт доходов/расходов |
| SchoolTask | `server/src/SchoolTask/` | Школьное расписание |
| Explorer | `server/src/Explorer/` | Файловый менеджер |

Клиент: `client/src/apps/*` — окна рабочего стола; `client/src/core/*` — auth, API, theme.

## Безопасность API

- JWT (`/api/login`, refresh, logout).
- Scope ACL: атрибут `#[Access('module.code')]` на контроллере + `#[Access('can_read|can_create|...')]` на методах.
- `AccessSubscriber` проверяет права до вызова action.
- Загрузки: `UploadPathResolver` (whitelist модулей, защита от path traversal).
- `/uploads` — только для аутентифицированных пользователей.

## Пагинация

Legacy-формат: `limit` / `offset` в теле POST + заголовок `Content-Range: items start-end/total`.

Утилита: `App\Http\ContentRangeHeaders::forLegacyPagination()`.

IncCom дополнительно поддерживает `page` / `size` через `LegacyPaginationAdapter`.

## Ошибки API

- 400 validation: `{ "message": "...", "violations": { "field": "..." } }` (`ApiExceptionSubscriber`).
- Legacy IBlock: плоский объект `{ "field": "message" }` — клиент поддерживает оба формата (`apiError.ts`).

## Клиент

- Один `QueryClient` в `client/src/core/api/queryClient.ts` (IncCom использует родительский provider из `App.tsx`).
- CRUD-хелперы: `client/src/core/api/crudHelpers.ts`.

## Тесты

- PHPUnit: `server/tests/`, база `sqlite` в `.env.test`.
- Vitest: `client/src/**/*.test.ts(x)`.
- CI: `.github/workflows/ci.yml`.

---

## ADR: каталог прав `setting.json` → `main_claimant.access_options` (этап 0, 2026-08-06)

Цель: синхронизировать claimants и варианты `can_*` в БД для Main Admin UI; **не** менять семантику `Access.level` (int bitmask) и scope-строк `can_*.module.entity`.

### Источник истины и runtime

| Потребитель | Источник | Примечание |
|-------------|----------|------------|
| Auth / `UserScopeResolver` / `ClaimantManager::getCanScopeValue` | **файл** `setting.json` (как as-is) | MVP: auth без смены источника |
| Admin UI (`app-access-modules`, list/detail) | **БД** `main_claimant.access_options` после sync | без второго запроса `/api/account/map` |

**Риск рассинхрона:** файл изменён, `main:claimant:sync` не запускали → UI показывает устаревшие/пустые options, auth уже видит новые биты (или наоборот после только sync). Митигация: обязательный sync в deploy (`server/update` + DEVELOPER_GUIDE); CLI `--dry-run`; при пустых options у claimant из protected-модуля — `{}` в API + warning в лог (не 503, не полный sync-on-read options).

### Schema `access_options` (нормализованная форма в БД / API)

Тип: JSON object, ключи только `can_*`.

```json
{
  "can_read": { "bit": 2, "title": "Чтение", "description": "опционально" }
}
```

| Поле | Тип | Обязательность |
|------|-----|----------------|
| `bit` | int > 0 | да |
| `title` | string | да (после нормализации sync) |
| `description` | string | нет |

Пустой каталог: `{}` (not null).

### Эволюция `map-access` в `setting.json` (compat)

Допустимы оба leaf-формата:

1. `"can_read": 2` — legacy number  
2. `"can_read": { "bit": 2, "title": "Чтение", "description": "…" }` — object  

Sync при записи в БД **всегда** нормализует к object. Default `title`, если отсутствует:

| Ключ | Title по умолчанию |
|------|-------------------|
| `can_create` | Создание |
| `can_read` | Чтение |
| `can_update` | Изменение |
| `can_delete` | Удаление |
| `can_access` | Права |
| `can_user` | Пользователи |
| `can_group` | Группы |
| `can_role` | Роли |
| `can_write` | Запись |
| `can_mod` | Модификация |
| `can_location` | Размещение |
| `can_write_off` | Списание |
| `can_repair` | Ремонт |
| прочий `can_*` | сам ключ (например `can_foo`) |

Отдельная секция `access-labels` **не** вводится.

**Важно при этапе 4 (обогащение файлов object-форматом):** `getCanScopeValue` / `sumCanBits` / клиентский `extractCanScopeMap` должны извлекать `bit` из object (`normalizeCanBit`), иначе `(int) array` / `typeof number` сломают auth и fallback UI. До этапа 4 файлы остаются number — текущий код совместим.

### Привязка map-access → claimant (как as-is)

| Claimant `code` | Узел `map-access` |
|-----------------|-------------------|
| `device` (1 сегмент = module) | корневые `can_*` модуля |
| `device.device` | `map-access.device` |
| `device.software.type` | `map-access.software.type` (nested) |

Корневые `can_*` модуля (напр. `can_write_off`) живут на **root claimant** модуля (`device`, `calendar`), не на виртуальной UI-строке.

### Orphan policy (soft)

- Sync **не удаляет** строки `main_claimant` (FK на accesses).
- Код отсутствует в текущем glob `setting.json` → orphan: оставить `code`/`name`, выставить `access_options = {}`, сообщить в stdout CLI.
- Отдельная колонка `is_active` / soft-flag в MVP **не** нужна: пустой `{}` + отчёт sync достаточно; UI вкладок строится из `ProtectedAppModules` + setting, orphans туда не попадут.
- Ручной DELETE через API по-прежнему возможен (существующий CRUD); sync его не заменяет.

### Колонка и миграция

- Имя: **`access_options`** (JSON).
- Стратегия: добавить колонку → backfill `{}` → **NOT NULL** с default `{}` (в PHP entity default `[]`).
- Nullable после cutover не оставлять.

### Sync CLI / deploy

- Команда: **`php bin/console main:claimant:sync`**
- `--dry-run` — validate + отчёт upsert/orphan/ошибок, без записи.
- `--force` — применить sync даже при предупреждении «bit для уже известного `can_*` изменился» (без `--force` — fail/reject этого ключа или всего sync — реализация: **abort sync с ненулевым exit**, если bit изменился; `--force` перезаписывает options, level в accesses не мигрирует).
- Точки запуска: после `doctrine:migrations:migrate` в `server/update` и раздел в DEVELOPER_GUIDE (этап 5 / 1.4).
- HTTP endpoint sync для ROOT в MVP **нет**.

### Scope sync vs UI

- Sync: **все** модули из glob `src/*/setting.json` (включая Todo, IBlock).
- UI «Доступ к приложениям»: только `ProtectedAppModules` (Todo/IBlock **не** включать, пока явно не попросят).

### API (см. `docs/API_SPEC.md`)

- `GET /api/main/claimant/app-access-modules` — у `root` и каждого `children[]` поле `access_options` из БД.
- list (`t=list`) / detail — то же поле.
- `/api/account/map`, `/api/scope/map` — без изменения контракта (сырой file `map-access`); UI вкладок после этапа 3 не использует map как каталог.
- `GET .../access-rules` — as-is (только Main из файла); deprecate в пользу app-access-modules позже.

### Клиент (целевой)

- Zod: `accessOptionSchema` + поле в `claimantListItemSchema` / `appAccessModuleSchema`.
- `accessRulesUtils`: scopeMap/labels из `access_options`; `CAN_SCOPE_LABELS` — только fallback.
- `levelToChecked` / `checkedToLevel` и сохранение accesses (claimant_id + level) без изменений.

### Нельзя ломать

- `main_user_access.level` / `main_group_access.level` int bitmask.
- Коды claimants и scope-строки `can_*.…`.
- Контракты POST/PUT user/group accesses.

---

## ADR: per-user app data KV (`user_app_data`)

Полный текст: **`docs/ADR-user-app-data.md`** (Accepted, 2026-08-06).

Реализовано: таблица `user_app_data` / entity `UserAppData` / API `/api/user-data` (`ApiUserDataController`) — opaque prefs/drafts/UI-state приложений.

Границы (кратко):

| Хранилище | Назначение |
|-----------|------------|
| `user_settings` (`/api/settings`) | Shell: USER / WIN / APP / HKEY_CONFIG |
| `user_app_data` (`/api/user-data`) | Opaque per-user app prefs / drafts / UI-state |
| Доменные API | Бизнес-сущности + scopes |
| `User.options` (`/api/account/options`) | **Legacy only** — новые app-ключи **запрещены** |

Только CurrentUser; ROOT без чужих KV; non-secret `value`; single PUT upsert (full replace) + `GET ?prefix=`; soft quota 500 keys; value ≤ 64 KB → 400. Клиент: `userData.ts`. См. также `DATABASE_SCHEMA.md`, `API_SPEC.md`, `DEVELOPER_GUIDE.md`.
