# ADR: Desktop state batch (один запрос load/save)

> Статус: **Accepted** (итерация 0, 2026-08-06)  
> Источник: оркестратор · задача «одним запросом состояние рабочего стола»  
> Связано: `docs/ADR-desktop-ux-sync.md` (hydrate/SoT/LWW — **не отменяет**), `docs/ADR-user-app-data.md` (границы KV)

## Контекст

Desktop UX sync (hydrate, debounce 2500 ms, Explorer path) — **DONE**. As-is при `VITE_USE_API_SETTINGS=true`:

- preload: `GET /api/settings`;
- writes: debounce → `POST /api/settings` `items[]`, но `launchHistory` flush immediate, WIN — отдельные ключи в batch, Explorer — отдельный `PUT /api/user-data`;
- итого **несколько HTTP** на hydrate и на save-цикл.

Нужен контракт: **один GET** и **один save** на весь snapshot рабочего стола, без ломки auth, доменных API и публичного CRUD `/api/settings` + `/api/user-data`.

## Решение: вариант **(A)** — aggregate `/api/desktop-state`

| | **(A) Aggregate endpoint** | **(B) Всё в `user_settings`** |
|--|----------------------------|-------------------------------|
| Идея | `GET`/`PUT /api/desktop-state` читает/пишет settings rows + `explorer.last_path` | Перенос Explorer path в settings; один `GET/POST /api/settings` |
| Explorer | Остаётся в `user_app_data` (как ADR-desktop-ux-sync) | Миграция code → APP/USER; ломает границы KV |
| HTTP «один запрос» | Да, включая Explorer | Да только после миграции; старый KV-ключ остаётся legacy |
| CRUD as-is | Рядом без изменений | CRUD settings ок; user-data для path устаревает |

**Выбор: (A).** Обоснование:

1. Один wire-запрос покрывает **два хранилища** без переноса Explorer в settings и без нарушения `ADR-user-app-data`.
2. Семантика «снимок рабочего стола» явнее, чем перегрузка generic settings list (HKEY_CONFIG и прочие ключи не в scope).
3. Старые endpoints остаются для адhoc/CRUD и обратной совместимости; клиент desktop-shell переключается на aggregate.
4. (B) дешевле на сервере на 1 JOIN/таблицу, но дороже политикой миграции + дублированием SoT path.

## Цель MVP

| In scope | Out of scope |
|----------|--------------|
| **Все** `USER.*` и `APP.*` ключи user в `user_settings` | `HKEY_CONFIG` (defaults, не SoT user) |
| Все `WIN.*` текущего user | Per-window Explorer path (v2) |
| `user_app_data` `explorer.last_path` | Clipboard, secrets, tokens |
| Клиент: `desktopStateApi.load()` / `save(snapshot)` — **единственный** HTTP для shell prefs | Optimistic lock / merge UI |
| | Удаление старых CRUD endpoints (остаются для adhoc) |

## Managed keys (сервер enforce)

| Источник | Что входит в snapshot |
|----------|------------------------|
| `user_settings` USER | **Все** ключи категории USER |
| `user_settings` APP | **Все** ключи категории APP (в т.ч. `launchHistory`) |
| `user_settings` WIN | **Все** ключи категории WIN |
| `user_app_data` | **Только** `explorer.last_path` |

`HKEY_CONFIG` и прочий KV **не** в snapshot. Save = upsert + orphan-delete по USER/APP/WIN.

### DTO — `DesktopStateSnapshot`

```json
{
  "settings": [
    {
      "category": "USER",
      "key": "theme",
      "value": "dark",
      "updatedAt": "2026-08-06T09:00:00+00:00"
    },
    {
      "category": "USER",
      "key": "startMenu.pinnedApps",
      "value": ["explorer", "calendar"],
      "updatedAt": "2026-08-06T09:00:00+00:00"
    },
    {
      "category": "APP",
      "key": "launchHistory",
      "value": [{ "appId": "explorer", "instanceKey": "…", "launchedAt": 0 }],
      "updatedAt": "2026-08-06T09:00:00+00:00"
    },
    {
      "category": "WIN",
      "key": "explorer/explorer__default",
      "value": { "position": {}, "state": {} },
      "updatedAt": "2026-08-06T09:00:00+00:00"
    }
  ],
  "explorerLastPath": {
    "path": "home://Docs",
    "updatedAt": "2026-08-06T09:00:00+00:00"
  }
}
```

Правила:

- `settings[]` — тот же shape item, что `/api/settings` (`category`, `key`, `value`, `updatedAt?`).
- `explorerLastPath`: объект `{ "path": string, "updatedAt"? }` **или** `null` (записи нет).
- На **request** (PUT) поле `updatedAt` **игнорируется** (информативное только в response).
- Пустой `settings: []` + `explorerLastPath: null` — валидный «пустой» snapshot (после orphan-delete managed set очищен).

### GET `/api/desktop-state`

**Response 200:** полный `DesktopStateSnapshot` (managed keys only; отсутствующие allowlist-ключи просто не в `settings`; path отсутствует → `explorerLastPath: null`).

**401:** нет JWT.

### PUT `/api/desktop-state`

**Request body:** `DesktopStateSnapshot` (без обязательных `updatedAt`).  
Допускается укороченный item: `{ category, key, value }`.

**Семантика save (Accepted):**

1. **Upsert** всех `settings[]` items (валидация category/key ∈ managed; value — как `UserSettingValidator`).
2. **Orphan delete (WIN):** все существующие `WIN.*` user, чьих `key` **нет** в `settings[]` → `DELETE`.
3. **Allowlist USER / APP.launchHistory:**  
   - ключ **есть** в body → upsert (в т.ч. `launchHistory: []`);  
   - ключ **отсутствует** в body → **DELETE** этой managed-записи (клиент обязан слать актуальный набор; пустой history = item с `[]`, не omit, если история «пустая но ключ жив» — см. клиент ниже).  
   **Клиентская норма:** всегда включать `launchHistory` (массив, возможно пустой) и известные USER allowlist-ключи, если они есть в local SoT; omit = явное удаление.
4. **Explorer:**  
   - `explorerLastPath: { path }` → upsert `user_app_data` code `explorer.last_path`, value `{ "path" }` (full replace);  
   - `explorerLastPath: null` → **DELETE** записи `explorer.last_path` (если была).
5. Всё в **одной DB-транзакции**.
6. Конфликт: **LWW** (как ADR-desktop-ux-sync); `updatedAt` не lock.

**Response 200:** сохранённый snapshot (как GET после операции).

**400:** невалидный body / category|key вне managed / validation value / oversized explorer value (те же лимиты KV).  
**401:** нет JWT.

**Не использовать** PATCH / partial merge snapshot. Не N× DELETE с клиента — orphans чистит сервер.

### Совместимость со старыми endpoints

| Endpoint | Политика |
|----------|----------|
| `GET/POST/DELETE /api/settings` | **Без изменений** wire; остаются для CRUD, тестов, non-desktop ключей |
| `GET/PUT/DELETE /api/user-data` | **Без изменений**; Explorer path по-прежнему можно трогать напрямую (не рекомендуется с desktop-shell после перехода) |
| Схема БД | **Без новых таблиц** |

После перехода клиента desktop-shell **не** должен параллельно слать debounce `POST /api/settings` + `PUT /api/user-data` для managed keys (двойная запись / гонки). CRUD endpoints — escape hatch / другие потребители.

## Клиент

| API | Сигнатура |
|-----|-----------|
| Load | `desktopStateApi.load(): Promise<DesktopStateSnapshot>` → `GET /api/desktop-state` |
| Save | `desktopStateApi.save(snapshot: DesktopStateSnapshot): Promise<DesktopStateSnapshot>` → `PUT /api/desktop-state` |

Файлы (рекомендация): `client/src/core/api/endpoints/desktopState.ts` + тонкий `desktopStateApi` re-export / facade.

### Hydrate order (замена preload settings + отдельный explorer GET)

1. Auth готов.
2. **`desktopStateApi.load()`** (один запрос) — при `VITE_USE_API_SETTINGS=true`.
3. Успех: **clear `xos.settings.*` + seed** из `snapshot.settings`; seed Explorer LS `xos.explorer.lastPath` из `explorerLastPath` (или clear path-cache если `null`); Composite/SettingManager **server-first** (local = cache).
4. Fail: toast + local degraded, **без** clear (как ADR-desktop-ux-sync).
5. `settingManager.init` → Desktop **`restoreFromHistory`** → WIN; Explorer path из уже засеянного cache/`resolveExplorerLastPath` (без второго HTTP).

### Debounce / flush

| Параметр | Значение |
|----------|----------|
| Local writes | Сразу (settings LS + explorer LS) |
| Server | **Один** `save(snapshot)` debounce **2500 ms** на весь snapshot |
| Сборка snapshot | Из local SoT: managed USER + `launchHistory` + все WIN + explorer path |
| WIN UI debounce 300 ms | Сохранить до local `settingManager.set`; поверх — 2500 ms snapshot save |
| Flush | `visibilitychange` hidden / `pagehide` / `beforeunload` → immediate `save` |
| Online listener | **Нет** (как as-is UX sync) |
| Не делать | N× PUT per key; отдельный Explorer PUT; immediate API flush только `launchHistory` в обход общего debounce (**убрать** исключение — history входит в тот же snapshot; unload flush покрывает close tab) |

`launchHistory` immediate API flush (as-is) **отменяется** в пользу единого snapshot debounce + unload flush (иначе снова >1 HTTP). Local history — сразу.

### Связь с SettingManager / Composite

Рекомендация реализации:

- При включённом desktop-state sync: **API-side writes managed keys** идут только через `DesktopStatePersister` (не через `ApiAdapter.set` / `setMany` для этих ключей).
- `LocalStorageAdapter` + in-memory поведение SettingManager — без изменений.
- Explorer: `ExplorerLastPathPersister` пишет LS сразу; серверный upsert заменяет вызов `desktopStateApi.save` через общий persister (или persister читает path из LS при сборке snapshot).

Точная склейка Composite vs отдельный persister — на developer; инвариант: **≤1 HTTP save** на debounce-окно.

## Defaults OQ (приняты)

| # | Тема | Решение |
|---|------|---------|
| 1 | Состав snapshot | USER allowlist (`theme`, `startMenu.pinnedApps`), `APP.launchHistory`, все `WIN.*`, `explorerLastPath` |
| 2 | Save | Full replace managed set: upsert body + server orphan-delete WIN / omitted allowlist keys / null explorer |
| 3 | Debounce | 2500 ms один save + flush unload/hide |
| 4 | Метод save | **PUT** (идемпотентный replace semantics) |
| 5 | Старые endpoints | Оставить рядом |
| 6 | Conflict | LWW; `updatedAt` информативный |

## Open questions — неблокирующие

| # | Вопрос | Рекомендация |
|---|--------|--------------|
| 1 | Расширять USER allowlist (`layout.*` и т.д.)? | Только ключи, уже реально идущие через settings pipeline shell; новый ключ — явное добавление в allowlist + ADR amend |
| 2 | `POST` alias рядом с PUT? | Не нужен MVP; только PUT |
| 3 | Feature-flag отдельный от `VITE_USE_API_SETTINGS`? | Нет: тот же флаг включает aggregate path |
| 4 | Миграция/cleanup старых per-key debounce путей | Iter client: удалить/обойти `setMany` для managed; не трогать CRUD |

## Связанные документы

- План: `docs/PLAN.md` (новая задача desktop-state batch)
- Предыдущий sync: `docs/ADR-desktop-ux-sync.md` (**DONE**, SoT/LWW наследуют)
- KV: `docs/ADR-user-app-data.md`
- API: `docs/API_SPEC.md` § Desktop state
- Обзор: `docs/ARCHITECTURE.md`, `docs/DEVELOPER_GUIDE.md`
