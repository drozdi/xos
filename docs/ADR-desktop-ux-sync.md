# ADR: Desktop UX sync (cross-browser)

> Статус: **Accepted** (итерация 0, 2026-08-06)  
> Источник: `docs/PLAN.md` · OQ закрыты defaults оркестратора + решения ниже  
> Связано: `docs/ADR-user-app-data.md` (границы KV **не** менять)

## Контекст

После login в другом браузере нужно восстанавливать shell UX «почти как есть»: pinned Start Menu, launch history / открытые приложения, WIN geometry, last folder Explorer. Сейчас: race seed local без await; Composite `get`/`getAll` — **local перекрывает API**; API writes без debounce; Explorer `currentPath` только в memory.

## Цель MVP

| В scope | Out of scope |
|---------|--------------|
| Theme, pinned Start Menu, `APP.launchHistory`, WIN geometry | Clipboard Explorer, secrets, tokens |
| Global last Explorer path | Per-window Explorer path (v2) |
| Server SoT после auth; LS = cache | Optimistic lock / merge UI |
| Debounced server writes + LWW | Новые категории settings; миграция `User.options` |
| | Полная «screenshot»-сессия (модалки, selection, scroll) |

## Решения (Accepted)

### 1. Source of truth

| Режим | SoT | localStorage |
|-------|-----|--------------|
| Auth + `VITE_USE_API_SETTINGS=true`, preload OK | **Server** | Write-through **cache** после успешного hydrate |
| Preload fail / offline / API error | Local (degraded) | Рабочий buffer; toast (см. § Fail preload) |
| Guest / API settings off | Local only | Как as-is |

После успешного hydrate чтения settings: **server-first** (`api` перекрывает `local` в merge `get`/`getAll`). До hydrate / в degraded — допустим local.

### 2. Hydrate order

1. **Auth успешен** (JWT / session ready).  
2. **Preload** `GET /api/settings` (все нужные категории USER|APP|WIN|…).  
3. **Barrier:** дождаться завершения seed в local **до** `settingManager.init` complete и до shell restore.  
4. **Cache policy при успешном preload:** **полный clear ключей `xos.settings.*`, затем seed** из preload (см. § Auth / guest).  
5. **`settingManager.init`** с Composite: server-first reads; API writes — debounced.  
6. **Desktop:** только **`restoreFromHistory`** → `launchApp` → WIN geometry.  
7. **Explorer path (параллельно / после auth):** `GET /api/user-data/explorer.last_path` (или из list prefix `explorer.`); при открытии Explorer подставить `path`, иначе fallback `home://`.

Не вызывать `restoreWindows()` в основном пути (см. § restoreWindows).

### 3. Debounce / batch server writes

| Параметр | Значение |
|----------|----------|
| Debounce API-side | **2500 ms** |
| Local `set` | **Сразу** (cache) |
| Coalesce | Batch через уже существующий **`POST /api/settings` `items[]`** |
| Wire-контракт `/api/settings` | **Не менять** (URL, категории, DTO) |
| WIN UI debounce 300 ms | Сохранить; поверх него — API debounce 2500 ms (не «тихий» loss: pending flush ≤ 2500 ms + unload flush) |

Explorer path save: тот же порядок **2500 ms** (отдельный timer на KV upsert; не через SettingManager).

### 4. Flush policy

| Событие | Поведение |
|---------|-----------|
| `visibilitychange` → hidden | **Да**, best-effort flush pending settings (+ pending Explorer path) |
| `beforeunload` / `pagehide` | **Да**, best-effort (может не завершиться — документировать) |
| Online после offline | **Целевое (ADR):** flush pending, если есть очередь. **As-is (iter 2/4):** отдельного `online` listener **нет** — pending settings flush на следующих `set` / visibility / unload; Explorer — на следующем `schedule` / pending flush (LS-buffer уже актуален). |

### 5. Conflict

- MVP: **last-write-wins** (последний успешный upsert побеждает).  
- `updatedAt` в DTO settings и `user_app_data` — **информативный** (не optimistic lock, не UI merge, не If-Match).  
- Два браузера одновременно — ожидаемо; без merge UI.  
- Согласовано с `ADR-user-app-data` (optimistic lock — out of scope).

### 6. Auth / guest → login (cache)

**Решение:** при **успешном** preload — **полный clear `xos.settings.*`, затем seed** из server preload + **server-first** `get`/`getAll`.

**Почему clear, а не только overwrite preloaded keys:** при guest→login в LS остаются ключи, которых нет на server; overwrite только preload-набора их не уберёт, и они могут всплыть в `getAll` / редких `get`. Clear-then-seed делает cache = точная копия SoT и закрывает guest bleed без сложной эвристики «orphan keys».

**Не clear** при fail preload (иначе потеряем единственный buffer) — см. ниже.

### 7. Fail preload

| Условие | Поведение |
|---------|-----------|
| Preload / API sync error | Существующий **toast** (жёлтый «локальная копия») + **local degraded OK** |
| Clear LS | **Не** выполнять |
| Shell | Стартует на local; server writes остаются best-effort с тем же toast |

### 8. Explorer last path

| Поле | Решение |
|------|---------|
| Хранилище | **`user_app_data`** (`/api/user-data`) — **не** WIN, **не** `User.options`, **не** дублировать в settings |
| `code` | **`explorer.last_path`** (только `[a-z0-9._-]`; camelCase недопустим) |
| Scope | **Global** last folder (MVP); per-window — out of MVP / v2 |
| Value shape | **Объект** (не raw string): см. ниже |
| Clipboard / selection / sort | **Не sync** |

```json
{ "path": "home://Docs" }
```

- `path`: non-empty string (Explorer URI / path as used by client).  
- Full replace value при upsert (как ADR-user-app-data).  
- При 404 / отсутствие записи / невалидный / недоступный path → **`home://`**.  
- Не класть path в `PersistedWindowState` / WIN props.

**Почему объект, не raw string:** единообразие с типичными JSON prefs; место для v2-полей без смены типа; Zod-схема проще (`{ path: string }`).

### 9. `restoreWindows`

| Факт | Политика |
|------|----------|
| Экспорт есть, **нигде не вызывается** | Считать **мёртвым / альтернативным** путём |
| Канонический restore | **`restoreFromHistory`** → `launchApp` → читает WIN |
| Удаление файла/экспорта | **Optional cleanup**, не блокер MVP |

Не унифицировать два пути в MVP — один канон: history.

### 10. Границы хранилищ (desktop UX)

| Данные | Куда | Не куда |
|--------|------|---------|
| Theme, pinned Start Menu, desktop layout | `user_settings` **USER** | `user_app_data`, `User.options` |
| Launch history | `user_settings` **APP** | Close вкладки/refresh **не** должен wipe history на сервере (иначе нет cross-browser restore); flush history сразу после save |
| Window geometry / min/max | `user_settings` **WIN** | Close вкладки **не** удаляет WIN; на unload — flush всех open windows |
| Explorer last folder | **`user_app_data`** `explorer.last_path` | WIN, USER, `User.options` |
| Clipboard, secrets, tokens | **Никуда (sync)** | settings, KV, options |

- **Не** добавлять категории settings.  
- **Не** ломать `/api/user-data`, auth, доменные API.  
- Правила ADR-user-app-data остаются в силе.

## Клиентская архитектура (указания к реализации)

| Компонент | Изменение (iter 1–4) |
|-----------|----------------------|
| `createSettingAdapter` / seed | `await seed`; clear-then-seed на успешный preload |
| `CompositeAdapter` | Server-first merge после hydrate; debounce+batch API `set`; local сразу |
| Flush hooks | `visibilitychange` / `pagehide`/`beforeunload` |
| `Desktop` | По-прежнему `restoreFromHistory` only |
| Explorer | Read/write `explorer.last_path` через `userData.ts`; debounce 2500 ms; не clipboard |

## Open questions — закрыты

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Debounce ms | **2500** |
| 2 | Explorer global vs per-window | **Global** MVP |
| 3 | Explorer storage | **`user_app_data`** `explorer.last_path` (не WIN) |
| 4 | Flush on hide/unload | **Да**, best-effort |
| 5 | Auth: clear vs overwrite | **Clear `xos.settings.*` + seed** при успешном preload (безопаснее guest bleed); fail → без clear |
| 6 | `restoreWindows` | Документировать как мёртвый; удаление optional |
| 7 | Sync Explorer selection/sort | **Нет** MVP |
| — | Value shape path | **`{ "path": string }`** |
| — | Conflict | **LWW**; `updatedAt` информативный |
| — | Settings wire API | Без изменений; batch = `items[]` |

## Отклонения от PLAN defaults

| Тема | PLAN default | ADR | Обоснование |
|------|--------------|-----|-------------|
| Auth cache | Overwrite preloaded + server-first merge | **Clear-then-seed** при успешном preload | Надёжнее против guest/orphan ключей в `getAll`; при fail preload clear **не** делаем → degraded local OK |
| Explorer value | «например object или raw» | Фиксирован **`{ "path": string }`** | Расширяемость + единообразие JSON prefs |

Остальные defaults оркестратора приняты без изменений.

## Связанные документы

- План UX sync: **DONE** (этот ADR). Текущий план: `docs/PLAN.md` → **desktop-state batch**.  
- Следующий wire: **`docs/ADR-desktop-state-batch.md`** (aggregate `GET`/`PUT /api/desktop-state`) — SoT/LWW/границы хранилищ отсюда наследуются.  
- KV: `docs/ADR-user-app-data.md`  
- Обзор: `docs/ARCHITECTURE.md`  
- Guide: `docs/DEVELOPER_GUIDE.md`
