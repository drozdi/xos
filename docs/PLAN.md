# XOS — План: desktop state batch (один запрос load/save)

> Версия: 2026-08-06  
> Цель: **одним HTTP** получать и сохранять состояние рабочего стола (USER allowlist + `APP.launchHistory` + все `WIN.*` + Explorer `explorer.last_path`), без ломки auth, доменных API и CRUD `/api/settings` + `/api/user-data`.  
> Формат: `- [ ]` для трекинга оркестратором.  
>
> **Предыдущий план** (Desktop UX sync: hydrate / debounce / Explorer) — **DONE**  
> (см. `docs/ADR-desktop-ux-sync.md`, `docs/STATUS.md`, `docs/TEST_REPORT.md`). Этот файл **заменён** под текущую задачу.

## Легенда

- **Зависимости:** номера этапов, которые должны быть завершены
- **Параллельность:** `[‖]` — можно выполнять параллельно с указанным этапом
- **Субагент:** рекомендуемый исполнитель

---

## Сводка

| | |
|---|---|
| **Продукт** | Aggregate desktop snapshot: 1× GET + 1× PUT |
| **ADR** | **(A)** `/api/desktop-state` — `docs/ADR-desktop-state-batch.md` (**Accepted**) |
| **Уже есть** | Settings CRUD, user-data CRUD, hydrate/debounce/Explorer path (UX sync DONE) |
| **Главный gap** | Несколько HTTP (settings list/batch + explorer PUT + immediate history flush) |
| **Не ломать** | Auth, доменные API, публичный CRUD `/api/settings` и `/api/user-data` |

### Scope (in)

1. Backend: `GET` + `PUT /api/desktop-state` (транзакция settings + explorer KV).
2. Save semantics: upsert snapshot + orphan-delete managed keys (WIN / omitted allowlist / null path).
3. Client: `desktopStateApi.load()` / `save(snapshot)`; hydrate через один load; один debounce save ~2500 ms + flush unload.
4. Отключить параллельные API writes managed keys (`setMany` / Explorer PUT / immediate history API).
5. Тесты + краткие docs.

### Scope out

- Перенос Explorer path в `user_settings` (вариант B отклонён).
- Удаление старых CRUD endpoints.
- Optimistic lock / merge UI; `online` auto-flush.
- Per-window Explorer path; clipboard/secrets.

---

## План (инкременты)

### Итерация 0 — Контракт Архитектора

**Зависимости:** —  
**Субагент:** `architect`

- [x] **0.1** ADR A vs B → **(A)** aggregate `/api/desktop-state`. → `docs/ADR-desktop-state-batch.md`
- [x] **0.2** DTO snapshot, managed keys, save/orphan semantics, hydrate, debounce, совместимость CRUD.
- [x] **0.3** Заменить `docs/PLAN.md`; pointers в `ARCHITECTURE.md` / `API_SPEC.md` / `DEVELOPER_GUIDE.md`.

**Проверка:** ADR Accepted; оркестратор может стартовать backend.

---

### Итерация 1 — Backend aggregate API

**Зависимости:** 0  
**Субагент:** `developer` (PHP) · `tester` после

- [x] **1.1** `DesktopStateService`: gather managed settings + `explorer.last_path`; serialize snapshot.
- [x] **1.2** `GET /api/desktop-state` → 200 snapshot (`explorerLastPath: null` если нет записи).
- [x] **1.3** `PUT /api/desktop-state`: upsert `settings[]` + explorer; orphan-delete WIN отсутствующих; DELETE omitted USER allowlist / `launchHistory`; `explorerLastPath: null` → delete KV; одна транзакция.
- [x] **1.4** Валидация: category/key ∈ managed; value через существующие validators; 400 на мусор.
- [x] **1.5** PHPUnit: load empty/full; save upsert; orphan WIN; null explorer; 401; не трогает non-managed keys.
- [x] **1.6** Не менять wire `/api/settings` и `/api/user-data` (регрессия существующих тестов).

**Проверка:** PHPUnit green; ручной curl GET/PUT с JWT.

---

### Итерация 2 — Client API + hydrate через load

**Зависимости:** 1  
**Субагент:** `developer` (TS) · `tester`

- [x] **2.1** `desktopState.ts`: Zod DTO; `load()` = GET; `save(snapshot)` = PUT; facade `desktopStateApi`.
- [x] **2.2** Hydrate path: при `VITE_USE_API_SETTINGS=true` заменить `preloadSettings` (+ отдельный explorer GET) на **`desktopStateApi.load()`**.
- [x] **2.3** Успех: clear-then-seed settings из `snapshot.settings`; seed/clear explorer LS из `explorerLastPath`; server-first.
- [x] **2.4** Fail load: toast + local degraded, без clear (как UX sync).
- [x] **2.5** Vitest: parse DTO; hydrate seed из snapshot mock.

**Проверка:** один network GET на старте shell (auth+flag); restoreFromHistory без второго settings list.

---

### Итерация 3 — Client единый debounce save

**Зависимости:** 2  
**Субагент:** `developer` · `tester`

- [x] **3.1** `DesktopStatePersister` (или эквивалент): сборка snapshot из local (USER allowlist + launchHistory + все WIN + explorer path).
- [x] **3.2** Debounce **2500 ms** → один `desktopStateApi.save`; local writes сразу.
- [x] **3.3** Flush на visibility hidden / pagehide / beforeunload.
- [x] **3.4** Отключить для managed keys: Composite `setMany`/`ApiAdapter` API writes; отдельный Explorer `PUT /api/user-data`; immediate API flush `launchHistory`.
- [x] **3.5** WIN UI debounce 300 ms сохранить (только до local set).
- [x] **3.6** Vitest fake timers: N local set → 1× `save`; flush immediate.

**Проверка:** DevTools — при drag окон не N× PUT; после debounce ровно один `/api/desktop-state`.

---

### Итерация 4 — Tester / docs / regression

**Зависимости:** 1–3  
**Субагент:** `tester` · `tech-writer` · `developer` hotfix

- [x] **4.1** PHPUnit: settings + user-data + desktop-state без регрессии. → target **28/28**; full suite blocked внешним `ExplorerApiTest` (out of scope)
- [x] **4.2** Vitest: desktopStateApi, hydrate, persister debounce/flush; guest / flag off = local-only. → target **53/53**; full suite blocked внешними auth/access (out of scope)
- [x] **4.3** Обновить `API_SPEC.md` / `DEVELOPER_GUIDE.md` / `ARCHITECTURE.md` до as-is (tech-writer может развернуть).
- [x] **4.4** `TEST_REPORT.md` / `STATUS.md` / smoke checklist (ниже).
- [x] **4.5** Пометить ADR-desktop-ux-sync как SoT/LWW baseline; pointer на ADR-desktop-state-batch для wire.

**Проверка:** automated green; docs согласованы с ADR.

---

## Smoke checklist (ручной)

1. `VITE_USE_API_SETTINGS=true`, два профиля, один user.
2. Network: после login **один** `GET /api/desktop-state` (нет обязательного `GET /api/settings` + `GET /api/user-data/explorer…` в hydrate path).
3. A: pin + открыть apps + подвигать окна + сменить папку Explorer → после ≥2500 ms **один** `PUT /api/desktop-state`.
4. B: login → pinned, history/apps, WIN geometry, Explorer path совпадают.
5. A: закрыть окно → следующий save без WIN-ключа; на B окно не восстанавливается.
6. Guest / flag off — без вызовов `/api/desktop-state`.
7. CRUD `/api/settings` и `/api/user-data` по-прежнему отвечают (smoke один GET).

---

## Open questions

> Неблокирующие — закрыты рекомендациями в ADR:

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | A vs B | **A** |
| 2 | Orphan / omit semantics | Server delete orphans в managed set |
| 3 | launchHistory immediate flush | Убрать; общий debounce + unload |
| 4 | USER allowlist расширение | Только явный amend ADR |

---

## Следующие шаги (оркестратор)

1. Iter **1** → `developer` (backend) + `tester`.
2. Затем **2 → 3** client; **4** docs/regression.
3. Не удалять CRUD endpoints в этой задаче.
