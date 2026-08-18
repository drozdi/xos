# TODO — Explorer: pickers + instance rules

> Источник: [PLAN.md](./PLAN.md) (2026-08-07).

## Легенда

- `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована

---

## Итерация 0 — Контракт Архитектора

**Зависимости:** —  
**Субагент:** `architect`

- [x] **0.1** Два appId: `explorer-open-picker` / `explorer-save-picker`
- [x] **0.2** Close: pendingResults → clear active → closeWindow; cancel: clear → close
- [x] **0.3** Persist: `WIN.documentPath`; hot cache pathByWindowId; restore via props
- [x] **0.4** Media: singleInstance + default + reload; multi: uuid/path-key
- [x] **0.5** ADR не нужен

---

## Итерация 1 — Picker apps + skipHistory + close

**Зависимости:** 0  
**Субагент:** `developer` (TS)

- [x] **1.1** Manifests `explorer-open-picker` / `explorer-save-picker`; не в Start Menu
- [x] **1.2** App shells → ExplorerWorkspace picker-режим
- [x] **1.3** `openExplorerPicker` → launch picker с `skipHistory: true`
- [x] **1.4** complete/cancel → закрыть окно picker
- [x] **1.5** Picker не в launchHistory; reload не восстанавливает

---

## Итерация 2 — Отвязать picker от explorer

**Зависимости:** 1  
**Субагент:** `developer`

- [x] **2.1** pickerMode prop; обычный explorer не берёт store.active для UI
- [x] **2.2** persistEnabled: !pickerMode
- [x] **2.3** Раздельные окна: explorer + picker

---

## Итерация 3 — Instance rules

**Зависимости:** 1 (2 желательно)  
**Субагент:** `developer`

- [x] **3.1** explorer: multi; Start/New → uuid instanceKey
- [x] **3.2** notepad/markdown/image/archiver: multi; Start без файла → uuid
- [x] **3.3** audio/video: singleInstance: true
- [x] **3.4** openVfsPathWithApp: media focus+reload; multi path/uuid
- [x] **3.5** Context «Новое окно» / Start Menu согласованы

---

## Итерация 4 — Persist last opened file

**Зависимости:** 3  
**Субагент:** `developer`

- [x] **4.1** Persisted path per app/window
- [x] **4.2** Reload + restoreFromHistory → тот же файл
- [x] **4.3** Multi-instance; picker не restore
- [x] **4.4** Не ломать dirty-close / save notepad & markdown

---

## Итерация 5 — UX Open menu (audio/video/archiver)

**Зависимости:** 1 (идеально после 3)  
**Субагент:** `developer`

- [x] **5.1** Убрать «Открыть…» из контента audio/video/archiver
- [x] **5.2** Меню Файл → Открыть… → openExplorerPicker
- [x] **5.3** Hotkey Ctrl+O

---

## Итерация 6 — Тесты + DoD

- [x] **6.1–6.3** Unit-тесты picker / singleInstance / close
- [x] **6.4** Smoke checklist в `docs/TEST_REPORT.md`
- [ ] Dirty-close/save notepad & markdown — manual pending

---

## Итерация 7 — Per-window Explorer folder path

- [x] **7.1–7.4** Отдельный documentPath per explorer window

---

## Итерация 8 — Multi notepad/markdown: per-window file

- [x] **8.1–8.4** uuid instanceKey, window-scoped picker consumer

---

## Hotfix (миграции, platform)

См. конец исходного трекера — hotfix access_options и board/pkb migrations (platform-level, не explorer UI).
