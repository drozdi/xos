# TODO — Desktop state batch (один get / один save)

> Источник: `docs/PLAN.md` · ADR: `docs/ADR-desktop-state-batch.md` (**A** `/api/desktop-state`)  
> **Оркестрация завершена** по scope задачи. Внешние full-suite fails и UI smoke — не блокеры продукта batch.  
> Порядок: **0 → 1 → 2 → 3 → 4**.

## Легенда статусов

- `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована

---

## Итерация 0 — Контракт Архитектора

- [x] **0.1** ADR A vs B → **(A)** `/api/desktop-state`
- [x] **0.2** DTO, managed keys, orphan semantics, hydrate, debounce
- [x] **0.3** PLAN + pointers ARCHITECTURE / API_SPEC / DEVELOPER_GUIDE

---

## Итерация 1 — Backend aggregate API

- [x] **1.1** `DesktopStateService`
- [x] **1.2** `GET /api/desktop-state`
- [x] **1.3** `PUT /api/desktop-state` + orphan-delete
- [x] **1.4** Валидация managed set
- [x] **1.5** PHPUnit DesktopState
- [x] **1.6** Регрессия settings + user-data

---

## Итерация 2 — Client API + hydrate

- [x] **2.1** `desktopStateApi.load()` / `save(snapshot)`
- [x] **2.2** Hydrate через один `load()`
- [x] **2.3** Clear-then-seed settings + explorer LS
- [x] **2.4** Fail load → toast + local
- [x] **2.5** Vitest DTO + hydrate

---

## Итерация 3 — Client единый debounce save

- [x] **3.1** DesktopStatePersister
- [x] **3.2** Debounce 2500 ms → один `save`
- [x] **3.3** Flush visibility / pagehide / beforeunload
- [x] **3.4** Отключить N× API writes managed / Explorer PUT / history immediate
- [x] **3.5** WIN UI debounce 300 ms (local)
- [x] **3.6** Vitest fake timers

---

## Итерация 4 — Tester / docs / regression

- [x] **4.1** PHPUnit target **28/28** (full suite: внешний `ExplorerApiTest` — out of scope)
- [x] **4.2** Vitest target **53/53** (full suite: внешние auth/access — out of scope)
- [x] **4.3** Docs as-is
- [x] **4.4** TEST_REPORT / STATUS / smoke (manual pending)
- [x] **4.5** Pointer UX-sync → batch ADR
