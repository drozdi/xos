# ADR: Per-user app data KV (`user_app_data`)

> Статус: **Accepted** (итерация 0, 2026-08-06)  
> Источник: `docs/PLAN.md` · Open questions закрыты оркестратором (defaults ниже)

## Контекст

Нужно отдельное opaque KV-хранилище для prefs / drafts / UI-state приложений, без смешения с shell-настройками (`user_settings`), legacy `User.options` и доменными API модулей.

## Решение — имена

| Артефакт | Имя |
|----------|-----|
| Таблица | `user_app_data` |
| Entity | `App\Entity\UserAppData` |
| Repository | `App\Repository\UserAppDataRepository` |
| Controller | `App\Controller\ApiUserDataController` |
| URL prefix | `/api/user-data` |
| Client helper | `client/src/core/api/endpoints/userData.ts` |

## Границы хранилищ

| Хранилище | Когда использовать | Когда **не** использовать |
|-----------|-------------------|---------------------------|
| **`user_settings`** (`/api/settings`) | Desktop shell: layout (USER), window geometry (WIN), launch history / app shell state (APP), defaults (HKEY_CONFIG). Читается `SettingManager` при старте | Prefs конкретного модуля, черновики форм, произвольный app UI-state |
| **`User.options`** (`/api/account/options`) | Только **legacy** профильный blob аккаунта | **Запрещено** добавлять новые app-ключи; не расширять |
| **Доменные entity** (`/api/{module}/…`) | Данные с бизнес-смыслом, связями, claimant scopes, списками/поиском | Opaque prefs без бизнес-модели |
| **`user_app_data`** (`/api/user-data`) | Opaque per-user данные **конкретного приложения**: prefs модуля, drafts, app-local UI state (не WIN geometry) | Secrets; shared/group state; document DB / query by value; window geometry |

### Правило выбора (кратко)

1. Window position/size/state → `user_settings` WIN.  
2. Desktop layout / panels → `user_settings` USER.  
3. Launch history / shell app chrome → `user_settings` APP.  
4. Бизнес-сущность с правами → доменный API.  
5. Остальное opaque per-user app payload → **`user_app_data`**.  
6. Новые ключи в `User.options` — **нет**.

## Модель ключа

- Одна колонка **`code`** (не пара `app` + `key`).
- Namespace: `{appNs}.{key…}` — минимум один сегмент после `appNs`, напр. `todo.ui.filters`, `inccom.draft.compose`.
- `appNs` — стабильный id модуля/приложения (согласовать с `appId` / именем модуля).
- **Не** дублировать категории settings (`USER`/`WIN`/…) внутри `code`.

### Charset и длина

- Regex: `^[a-z0-9._-]+$` (не пустой, без пробелов и control chars).
- Max length: **191** (VARCHAR(191), совместимо с unique index MySQL utf8mb4).

## Схема полей

| Поле | Тип | Правила |
|------|-----|---------|
| `id` | INT PK AI | Суррогат |
| `user_id` | FK → `main_user` ON DELETE CASCADE | Владелец; всегда = CurrentUser |
| `code` | VARCHAR(191) NOT NULL | См. charset выше |
| `value` | JSON NOT NULL | JSON-совместимый payload (объект, массив, скаляр) |
| `created_at` | DATETIME immutable | При insert |
| `updated_at` | DATETIME immutable | При каждом upsert |

**Unique:** `(user_id, code)`.  
**Индекс list-by-prefix:** unique `(user_id, code)` достаточен для `WHERE user_id = ? AND code LIKE 'todo.%'` (left-prefix).

## Квоты (MVP)

| Лимит | Значение | Поведение |
|-------|----------|-----------|
| `code` length | ≤ 191 | 400 validation |
| `value` size | ≤ **64 KB** (UTF-8 длина JSON-encoded строки) | 400 (или 413 — рекомендация: **400** + `violations.value`, единообразно с settings) |
| Keys per user | **мягкий** max **500** | На **insert** нового code: если count ≥ 500 → 400; **update** существующего code — разрешён |

Жёсткий rate-limit / encryption at-rest — out of scope (v2).

## API (контракт)

См. `docs/API_SPEC.md` § User App Data.

| Method | Path | Поведение |
|--------|------|-----------|
| GET | `/api/user-data` | List текущего user; query `?prefix=` (optional, match `code LIKE '{prefix}%'`) |
| GET | `/api/user-data/{code}` | Одна запись; `{code}` URL-encoded; 404 если нет |
| PUT | `/api/user-data` | Single upsert `{ code, value }` — **full replace** value |
| DELETE | `/api/user-data/{code}` | 204 если удалено; 404 если нет |

**DTO ответа:** `{ code, value, createdAt, updatedAt }` (`id` опционален — в MVP **не** обязателен в JSON).

**Batch upsert:** **не** в MVP. v2 — по образцу `POST /api/settings` (`items[]`), если понадобится.

**Partial / Merge / JSON Patch value:** **нет** в MVP; всегда полный `value`.

## Security

| Правило | MVP |
|---------|-----|
| Auth | Существующий firewall `^/api` → `IS_AUTHENTICATED_FULLY` (JWT) |
| Владелец | Все операции только для `#[CurrentUser]`; `user_id` из токена |
| Чужой `userId` в body | Игнорировать / не принимать в DTO (поля нет) |
| ROOT / ROLE_*_ROOT | **Нет** доступа к чужим KV; admin UI чужих записей — out of scope |
| Claimant scopes | Не требуются для opaque prefs |
| Non-secret policy | См. ниже |

### Non-secret policy (обязательно)

В `value` **запрещено** хранить:

- пароли, API keys, refresh/access tokens;
- приватные ключи, сертификаты;
- секреты интеграции / webhook secrets;
- избыточный PII сверх необходимого для prefs.

Митигация MVP: документация + лимит размера + **не логировать** `value` в application logs. Шифрование / vault — v2.

Если данные «чувствительны» по смыслу модуля — держать в доменном API с scopes, не в KV.

## Клиент

- Отдельный helper `userData.ts` (Zod + list/get/upsert/delete).
- **Не** встраивать в `SettingManager` / категории USER|APP|WIN.
- Query keys: `['userData', …]`.
- Пилот 3.4 — **optional**, не блокер итерации 0–2.

## Out of scope (явно)

- Миграция из `User.options` / `user_settings` APP.
- Shared / group-scoped KV.
- Optimistic lock конфликтов (достаточно `updatedAt` в ответе).
- Admin read чужих KV.
- Batch / JSON Patch.

## Open questions — закрыты (defaults оркестратора)

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Имя | `user_app_data` / `UserAppData` / `/api/user-data` |
| 2 | Модель ключа | Один `code` с namespace `{appNs}.{key…}` |
| 3 | ROOT | Нет доступа к чужим KV в MVP |
| 4 | Batch | Single upsert в MVP; batch — v2 |
| 5 | Пилот | 3.4 optional — не блокер |
| 6 | Prefix list | `GET ?prefix=` сразу |
| 7 | Patch value | Только full replace |
| 8 | Квота | code ≤191; value ≤64 KB; soft max 500 keys/user |

## Связанные документы

- Схема: `docs/DATABASE_SCHEMA.md` (§ UserAppData)
- API: `docs/API_SPEC.md` (§ User App Data)
- План: `docs/PLAN.md` (итерации 1+)
- Обзор: `docs/ARCHITECTURE.md` (ссылка)
