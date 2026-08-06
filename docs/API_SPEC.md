# XOS — REST API Specification

> Версия: 2026-08-06 (`/api/user-data` реализован; claimant `access_options`)  
> Base URL: `{SERVER_URL}` (dev: `http://localhost:8000`)  
> Prefix: все эндпоинты ниже — **фактические пути** из кода + планируемые помечены `[NEW]` / `[CONTRACT]`

## Общие соглашения

### Аутентификация

- **Access JWT:** заголовок `Authorization: Bearer {token}`
- **Refresh:** POST `/api/token/refresh` с телом `{ "refresh_token": "..." }` (Gesdinet)
- **Login:** POST `/api/login` с телом `{ "username": "login", "password": "..." }` (поле `username`, не `login`)
- TTL access: **15 мин** (`lexik_jwt_authentication.token_ttl`)
- TTL refresh: **7200 с**, single-use

### Формат ошибок

```json
{
  "code": 401,
  "message": "Invalid JWT Token"
}
```

Валидация (400):

```json
{
  "email": "Email не является валидным email.",
  "password": "Пароли не совпадают"
}
```

### Пагинация списков (legacy-паттерн)

POST `/list` с телом:

```json
{
  "t": "list",
  "limit": 20,
  "offset": 1,
  "sortBy": [{ "key": "login", "order": "ASC" }],
  "filters": {}
}
```

Ответ: массив + заголовок `Content-Range: items {start}-{end}/{total}`.

`t: "select"` → `{ value, label }[]`.

---

## Auth & Account (модуль App)

### POST `/api/login`

**Auth:** Public  
**Реализация:** Symfony `json_login` + Lexik JWT (контроллер — заглушка, логика в firewall)

**Request:**
```json
{ "username": "admin", "password": "secret" }
```

**Response 200 (Lexik default):**
```json
{
  "token": "eyJ...",
  "refresh_token": "abc123..."
}
```

**Response 401:** `{ "code": 401, "message": "Invalid credentials." }`

> **Рекомендация [TODO]:** кастомный `AuthenticationSuccessHandler` — добавить `user` с roles/scopes (см. LoginSuccessHandler.php).

---

### POST `/api/token/refresh`

**Auth:** Public (refresh firewall)  
**Request:**
```json
{ "refresh_token": "..." }
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "refresh_token": "new_refresh..."
}
```

> ТЗ указывает `/refresh-token` — **фактический путь `/api/token/refresh`**. Клиент использует этот путь.

---

### GET `/api/login-check`

**Auth:** JWT  
**Response 200:** `{ "status": "authenticated" }`  
**Response 401:** `{ "error": "Unauthorized" }`

---

### GET `/api/logout`

**Auth:** JWT  
**Статус:** `[TODO]` — logout не активирован в security.yaml (throws Exception).  
**Целевое поведение:** инвалидация refresh-токена, 200 `{ "status": "logged_out" }`.

---

### GET `/api/user`

**Auth:** JWT  
**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "roles": ["ROLE_ADMIN", "ROLE_USER"]
}
```

> **Рекомендация [TODO]:** расширить ответ полями `login`, `alias`, `scopes` (объект code→level).

---

### GET `/api/account`

**Auth:** JWT  
**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "alias": "Admin",
  "second_name": "Иванов",
  "first_name": "Иван",
  "patronymic": "Иванович",
  "description": "",
  "date_register": "2024-01-01 12:00:00",
  "tutor": "mentor_alias",
  "last_login": "2026-07-14 09:00:00",
  "x_timestamp": "2026-07-14 09:00:00"
}
```

---

### PUT `/api/account`

**Auth:** JWT  
**Request:**
```json
{
  "email": "user@example.com",
  "alias": "Admin",
  "second_name": "Иванов",
  "first_name": "Иван",
  "patronymic": "Иванович",
  "description": "Bio",
  "password": "newpass",
  "confirm_password": "newpass"
}
```

**Response 201:** `1` (id пользователя) — *текущее поведение*  
**Response 400:** объект ошибок по полям

---

### GET `/api/account/map`

**Auth:** JWT  
**Назначение:** сырой `map-access` из файлов `setting.json` для **auth/runtime** (scopes при логине и т.п.).

> **Deprecation (UI-каталог):** не использовать как каталог прав для Main Admin UI (вкладки User/Group Access). Для каталога чекбоксов — `GET /api/main/claimant/app-access-modules` и поле `access_options` (см. Claimants ниже). Endpoint map **сохраняется** для runtime.

**Response 200:** объект claimant_code → массив map-access

```json
{
  "device": ["read", "write", "delete"],
  "main": ["read"]
}
```

---

### GET `/api/account/accesses`

**Auth:** JWT  
**Response 200:** объект scope_code → int (битовая маска, OR пользователя и ролей)

```json
{
  "device.read": 15,
  "device.write": 7,
  "main.user": 3
}
```

---

### GET `/api/account/roles`

**Auth:** JWT  
**Response 200:** `["ROLE_ADMIN", "ROLE_USER"]`

---

### GET `/api/account/options`

**Auth:** JWT  
**Response 200:** произвольный JSON из `User.options`

---

### PUT `/api/account/options`

**Auth:** JWT  
**Request:** JSON object (merge/replace — текущее: **replace** через `setOptions`)  
**Response 200:** обновлённый объект options

---

### GET `/api/scope/map` · GET `/api/scope/accesses`

Дубликаты `/api/account/map` и `/api/account/accesses`. Клиенту достаточно account-вариантов. Для каталога прав Admin UI — не map, а `app-access-modules` + `access_options`.

---

## Settings `[NEW]`

Контроллер: `App\Controller\ApiSettingsController`  
Сущность: `UserSetting` (см. DATABASE_SCHEMA.md)

### GET `/api/settings`

**Auth:** JWT  
**Query:** `category?` (USER|APP|WIN|HKEY_CONFIG)

**Response 200:**
```json
{
  "items": [
    {
      "category": "WIN",
      "key": "users",
      "value": {
        "position": { "x": 100, "y": 50, "width": 800, "height": 600 },
        "state": { "minimized": false, "maximized": false },
        "wmGroup": "admin",
        "wmSort": 0
      },
      "updatedAt": "2026-07-14T09:00:00+00:00"
    }
  ]
}
```

---

### GET `/api/settings/{category}/{key}`

**Auth:** JWT  
**Params:** `category` — enum; `key` — dot-path (URL-encoded)

**Response 200:**
```json
{
  "category": "USER",
  "key": "layout.panels.left.width",
  "value": 280,
  "updatedAt": "2026-07-14T09:00:00+00:00"
}
```

**Response 404:** `{ "message": "Setting not found" }`

---

### POST `/api/settings`

**Auth:** JWT  
**Request (single):**
```json
{
  "category": "WIN",
  "key": "users",
  "value": { "position": { "x": 0, "y": 0, "width": 1024, "height": 768 } }
}
```

**Request (batch):**
```json
{
  "items": [
    { "category": "WIN", "key": "users", "value": {} },
    { "category": "USER", "key": "layout.view", "value": "hhh lmr ffr" }
  ]
}
```

**Response 200/201:** сохранённые записи (upsert по user+category+key)

---

### DELETE `/api/settings/{category}/{key}`

**Auth:** JWT  
**Response 204**

---

## User App Data

> ADR: `docs/ADR-user-app-data.md`.  
> Не путать с `/api/settings` (shell) и `/api/account/options` (legacy).

Контроллер: `App\Controller\ApiUserDataController`  
Сущность: `UserAppData` → таблица `user_app_data`  
Клиент: `client/src/core/api/endpoints/userData.ts`

**Auth:** JWT (`^/api`, `IS_AUTHENTICATED_FULLY`). Все операции только для `CurrentUser`. ROOT **не** читает чужие записи. Поля `userId` в body нет.

### DTO

```json
{
  "code": "todo.ui.filters",
  "value": { "status": "open" },
  "createdAt": "2026-08-06T09:00:00+00:00",
  "updatedAt": "2026-08-06T09:00:00+00:00"
}
```

`id` в JSON-ответе **не** отдаётся (только `code`, `value`, `createdAt`, `updatedAt`). Даты — ISO-8601 (`DateTimeInterface::ATOM`).

### GET `/api/user-data`

**Query:** `prefix?` (string) — если непустой, фильтр `code LIKE '{prefix}%'` (напр. `todo.`). Пустой / отсутствующий — все ключи текущего user.

**Response 200:**
```json
{
  "items": [
    {
      "code": "todo.ui.filters",
      "value": { "status": "open" },
      "createdAt": "2026-08-06T09:00:00+00:00",
      "updatedAt": "2026-08-06T09:05:00+00:00"
    }
  ]
}
```

**Response 400:** не-string `prefix` → `{ "message": "Query parameter \"prefix\" must be a string" }`.  
**Response 401:** нет JWT → `{ "message": "missing credentials" }`.

---

### GET `/api/user-data/{code}`

**Params:** `code` — URL-encoded (точки допустимы; charset `[a-z0-9._-]`; route requirement `.+`). Сервер делает `rawurldecode`.

**Response 200:** один DTO (см. выше).  
**Response 401:** `{ "message": "missing credentials" }`.  
**Response 404:** `{ "message": "User data not found" }`.

---

### PUT `/api/user-data`

Single upsert, **full replace** `value` (partial / merge / JSON Patch — нет).

**Request:**
```json
{
  "code": "todo.ui.filters",
  "value": { "status": "done", "assignee": null }
}
```

**Response 200:** сохранённый DTO (create или update).  
**Response 400:** `{ "message": "<validation>" }` — пустой/невалидный `code`, `code` > 191, отсутствует `value`, non-JSON-serializable `value`, `value` > 64 KB (JSON-encoded), soft quota на **insert** при ≥ 500 keys.  
**Response 401:** `{ "message": "missing credentials" }`.

Примеры `message` (валидатор):  
`Field "code" must match ^[a-z0-9._-]+$` · `Field "value" must not exceed 65536 bytes when JSON-encoded` · `Maximum of 500 keys per user exceeded`.

Batch `items[]` — **не** в MVP (v2).

---

### DELETE `/api/user-data/{code}`

**Response 204** — удалено (пустое тело).  
**Response 401:** `{ "message": "missing credentials" }`.  
**Response 404:** `{ "message": "User data not found" }`.

---

### Ошибки / лимиты

| Код | Когда |
|-----|--------|
| 401 | Не авторизован |
| 400 | Невалидный `code` / oversized `value` / soft quota на insert / неверный `prefix` |
| 404 | Get/Delete несуществующего code |
| 204 | Успешный DELETE |
| 403 | Не используется для «чужой user» — чужие записи недоступны (нет endpoint с userId) |

**Non-secret:** в `value` нельзя класть пароли, tokens, private keys (политика ADR; сервер не сканирует содержимое в MVP). Oversized value → **400** (не 413).

---
## Main — Users, Groups, OU, Claimants, Files

Prefix: `/api/main/`

### Users — `/api/main/user`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list` | Список/селект пользователей |
| GET | `/filter` | Фильтры OU/Group для UI |
| GET | `/{id}` | Детальная карточка |
| POST | `/` | Создание |
| PUT | `/{id}` | Обновление |
| DELETE | `/{id}` | Удаление |

**Detail Response (GET /{id}):** id, login, email, alias, ФИО, roles[], groups[], accesses[], ou, tutor, active, dates.

---

### Groups — `/api/main/group`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list` | Список |
| GET | `/filter` | Дерево групп |
| GET | `/{id}` | Деталь |
| POST | `/` | Создание |
| PUT | `/{id}` | Обновление |
| DELETE | `/{id}` | Удаление |

---

### OU — `/api/main/ou`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list` | Список |
| GET | `/{id}` | Деталь |
| POST | `/` | Создание |
| PUT | `/{id}` | Обновление |
| DELETE | `/{id}` | Удаление |

---

### Claimants — `/api/main/claimant`

| Method | Path | Описание |
|--------|------|----------|
| GET | `/app-access-modules` | Модули для вкладки «Доступ к приложениям» + `access_options` |
| GET | `/access-rules` | Legacy: claimant + map-access только Main из `setting.json` |
| POST | `/list` | Список (тело legacy list) |
| POST | `/` | Создание |
| GET | `/{id}` | Деталь |
| PUT | `/{id}` | Обновление |
| DELETE | `/{id}` | Удаление |

#### Тип `AccessOptions` (БД / API)

```json
{
  "can_read": { "bit": 2, "title": "Чтение" },
  "can_create": { "bit": 1, "title": "Создание", "description": "опционально" }
}
```

Пустой объект `{}`, если sync не заполнял или claimant orphan. Поле **всегда** присутствует в ответах ниже (не `null`).

#### GET `/api/main/claimant/app-access-modules`

**Auth:** JWT  
**Реализация:** `ClaimantManager::getAppAccessModules()` — только модули из `ProtectedAppModules` (Todo/IBlock не входят).  
**Источник options:** колонка `main_claimant.access_options` (после sync). При отсутствии sync → `{}` + warning в лог сервера (не 503).

**Response 200:**

```json
[
  {
    "module": "device",
    "moduleLabel": "Устройства",
    "root": {
      "id": 10,
      "code": "device",
      "name": "Устройства",
      "access_options": {
        "can_write_off": { "bit": 16, "title": "Списание" }
      }
    },
    "children": [
      {
        "id": 11,
        "code": "device.device",
        "name": "Устройства: Устройства",
        "access_options": {
          "can_create": { "bit": 1, "title": "Создание" },
          "can_read": { "bit": 2, "title": "Чтение" },
          "can_update": { "bit": 4, "title": "Изменение" },
          "can_delete": { "bit": 8, "title": "Удаление" },
          "can_mod": { "bit": 16, "title": "Модификация" },
          "can_location": { "bit": 32, "title": "Размещение" },
          "can_repair": { "bit": 64, "title": "Ремонт" }
        }
      }
    ]
  }
]
```

- `root` опционален (есть, если в setting есть claimant с code = имя модуля).
- Корневые `can_*` модуля — в `root.access_options`.
- Zod (клиент): расширить `claimantListItemSchema` полем `access_options`.

#### POST `/api/main/claimant/list` (`t: "list"`)

**Auth:** JWT + scope read `main.claimant`  
Элемент списка:

```json
{
  "id": 1,
  "code": "main.user",
  "name": "Main: Пользователи",
  "access_options": {
    "can_create": { "bit": 1, "title": "Создание" }
  }
}
```

`t: "select"` — без изменений: `{ value, label }` (options не нужны).

#### GET `/api/main/claimant/{id}`

**Response 200:**

```json
{
  "id": 1,
  "code": "main.user",
  "name": "Main: Пользователи",
  "access_options": { }
}
```

#### Сохранение user/group accesses

Без изменений: `claimant_id` + `level` (int bitmask). Каталог `access_options` только описывает биты для UI.

#### Sync (не HTTP в MVP)

`php bin/console main:claimant:sync [--dry-run] [--force]` — см. ADR в `docs/ARCHITECTURE.md` и раздел «Claimants и can_*» в `docs/DEVELOPER_GUIDE.md`.

**Orphan (soft):** CLI печатает в stdout строки вида `orphan (N): code1, code2`. Записи в БД **не удаляются**; у orphan выставляется `access_options = {}`. Ручной DELETE через API sync не заменяет.

**Deploy:** после `doctrine:migrations:migrate` — `main:claimant:sync` (уже в `server/update`).

---

### Files — `/api/main/file`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/upload` | multipart/form-data, поле `file` |

**Response 200:**
```json
{
  "id": 42,
  "originalName": "doc.pdf",
  "url": "/uploads/..."
}
```

---

## Device

> **Важно:** текущие маршруты **без префикса `/api`** (`/device/...`). JWT-firewall покрывает только `^/api`.  
> **Рекомендация:** мигрировать на `/api/device/...` и добавить access_control.

### Devices — `/device/device` → `[TARGET]` `/api/device/device`

| Method | Path | Описание |
|--------|------|----------|
| GET | `/filter` | Фильтры для списка |
| POST | `/select` | Select-options |
| POST | `/list` | Список с пагинацией |
| GET | `/{id}` | Деталь устройства |
| POST | `/` | Создание |
| PUT | `/{id}` | Обновление |
| DELETE | `/{id}` | Удаление |
| GET | `/property/{id}` | Свойство |
| GET | `/properties/{id}` | Все свойства |
| POST | `/upload` | Загрузка файла |

---

### Types — `/device/types`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/select`, `/list` | |
| GET/POST | `/components`, `/properties` | |
| POST | `/` | Создание |
| GET/PUT/DELETE | `/{id}` | CRUD |

---

### Properties — `/device/properties`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/select`, `/list`, `/props` | |
| POST | `/` | Создание |
| GET/PUT/DELETE | `/{id}` | CRUD |

---

### Components — `/device/components`

CRUD + `/select`, `/list`.

---

### Software — `/device/software`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list`, `/select` | |
| GET | `/filter` | |
| POST | `/` | |
| GET/PUT/DELETE | `/{id}` | |

---

### Software Types — `/device/software/type`

CRUD + `/list`, `/select`.

---

### Licenses — `/device/license`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list` | |
| POST | `/` | |
| GET/PUT | `/{id}` | |
| DELETE | `/remove/{id}` | |

---

### License Keys — `/device/license/key`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list` | |
| GET/PUT | `/{id}` | |

---

### Accounting — `/device/accounting`

| Method | Path | Описание |
|--------|------|----------|
| POST | `/list`, `/list/select` | |

---

### SubDevices — `/device/subDevices`

| Method | Path | Описание |
|--------|------|----------|
| GET | `/filter`, `/form/{id}`, `/attach/{id}` | |
| POST | `/select`, `/list`, `/` | |
| GET/PUT/DELETE | `/{id}` | |

---

## IBlock `[NEW]`

Контроллеры отсутствуют. Целевой prefix: `/api/iblock/`

| Resource | Endpoints |
|----------|-----------|
| `/api/iblock/block` | CRUD + POST `/list` |
| `/api/iblock/element` | CRUD + POST `/list` |
| `/api/iblock/section` | CRUD |
| `/api/iblock/property` | CRUD |
| `/api/iblock/type` | CRUD |

---

## HTTP Status Codes

| Code | Использование |
|------|---------------|
| 200 | Успешное чтение/обновление |
| 201 | Создание (account update возвращает 201 с id) |
| 204 | DELETE settings / user-data |
| 400 | Валидация |
| 401 | Не авторизован / истёк JWT |
| 403 | Нет scope/role (Access attribute) |
| 404 | Сущность/настройка/user-data не найдена |
| 409 | Конфликт версии (@Version) |
| 500 | Server error |

> User-data oversized value: MVP → **400** (не 413), единообразно с validation settings.

---

## Клиентские TypeScript-типы (reference)

```typescript
// types/api.types.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
}

export interface RefreshResponse {
  token: string;
  refresh_token: string;
}

export interface UserSummary {
  id: number;
  email: string | null;
  login?: string;
  alias?: string;
  roles: string[];
  scopes?: Record<string, number>;
}

export interface AccountDetail {
  id: number;
  email: string | null;
  alias: string | null;
  second_name: string | null;
  first_name: string | null;
  patronymic: string | null;
  description: string | null;
  date_register: string | null;
  tutor: string;
  last_login: string | null;
  x_timestamp: string | null;
}

export type SettingCategory = 'USER' | 'APP' | 'WIN' | 'HKEY_CONFIG';

export interface UserSettingDto {
  category: SettingCategory;
  key: string;
  value: unknown;
  updatedAt?: string;
}

export interface SettingsBatchRequest {
  items: Array<{ category: SettingCategory; key: string; value: unknown }>;
}

/** Per-user opaque KV — /api/user-data (см. ADR-user-app-data) */
export interface UserAppDataDto {
  code: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface UserAppDataUpsertRequest {
  code: string;
  value: unknown;
}

export interface ListRequest {
  t?: 'list' | 'select';
  limit?: number;
  offset?: number;
  sortBy?: Array<{ key: string; order: 'ASC' | 'DESC' }>;
  filters?: Record<string, unknown>;
}

export interface ApiError {
  code?: number;
  message?: string;
  [field: string]: unknown;
}
```

---

## TanStack Query Keys (reference)

```typescript
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    check: ['auth', 'check'] as const,
  },
  account: {
    detail: ['account', 'detail'] as const,
    map: ['account', 'map'] as const,
    accesses: ['account', 'accesses'] as const,
    roles: ['account', 'roles'] as const,
    options: ['account', 'options'] as const,
  },
  settings: {
    all: (category?: SettingCategory) => ['settings', category ?? 'all'] as const,
    one: (category: SettingCategory, key: string) => ['settings', category, key] as const,
  },
  userData: {
    list: (prefix?: string) => ['userData', 'list', prefix ?? ''] as const,
    one: (code: string) => ['userData', 'one', code] as const,
  },
  main: {
    users: (filters: ListRequest) => ['main', 'users', filters] as const,
    user: (id: number) => ['main', 'user', id] as const,
    groups: (filters: ListRequest) => ['main', 'groups', filters] as const,
  },
  device: {
    list: (filters: ListRequest) => ['device', 'list', filters] as const,
    detail: (id: number) => ['device', 'detail', id] as const,
  },
} as const;
```

---

## Axios Interceptors (reference)

```typescript
// Порядок: request → attach Bearer; response → 401 → refresh queue → retry
// При неудачном refresh → logout + redirect to login screen
// 403 → toast.error('Доступ запрещён')
// Network error → toast + optional ApiAdapter fallback
```

Token storage keys (localStorage, dev):
- `xos.access_token`
- `xos.refresh_token`

---

## Calendar module (`/api/calendar`)

Google-like calendars (own + shared) and standalone SPA `/calendar`.

### Auth (standalone)

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/calendar/auth/login` | PUBLIC (email + password) |
| GET | `/api/calendar/auth/me` | JWT |
| POST | `/api/calendar/auth/logout` | PUBLIC (body `refresh_token`) |
| POST | `/api/calendar/token/refresh` | PUBLIC |

### Calendars & events

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/calendar/calendars` | list (auto-creates «Личный» if empty) / create `{ title, color }` |
| GET/PUT/DELETE | `/api/calendar/calendars/{id}` | |
| POST | `/api/calendar/calendars/{id}/share` | `{ email, permission: read\|write }` |
| DELETE | `/api/calendar/calendars/{id}/share/{userId}` | |
| GET | `/api/calendar/users/by-email?email=` | |
| POST | `/api/calendar/events/query` | `{ start, end, calendar_ids? }` |
| POST | `/api/calendar/events` | create |
| PUT/DELETE | `/api/calendar/events/{id}` | |

### Todo overlay

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/todo/items/due?start=&end=` | due items in range across accessible lists |

SchoolTask overlay uses existing `POST /api/schooltask/calendar/teacher/events`.
