# TODO — Open/Save As pickers + instance rules

> Источник: `docs/PLAN.md` (2026-08-07).  
> **Не коммитить** без явной просьбы.

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
- [x] **2.3** Раздельные окна: explorer + picker (код готов; smoke в iter 6)

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

- [x] **4.1** Persisted path per app/window (механизм из 0.3)
- [x] **4.2** Reload + restoreFromHistory → тот же файл
- [x] **4.3** Multi-instance; picker не restore
- [x] **4.4** Не ломать dirty-close / save notepad & markdown

---

## Итерация 5 — UX Open menu (audio/video/archiver)

**Зависимости:** 1 (идеально после 3)  
**Субагент:** `developer`

- [x] **5.1** Убрать «Открыть…» из контента audio/video/archiver
- [x] **5.2** Меню Файл → Открыть… → openExplorerPicker
- [x] **5.3** Hotkey Ctrl+O как у siblings

---

## Итерация 6 — Тесты + DoD

**Зависимости:** 1–5  
**Субагент:** `tester` · `developer`

- [x] **6.1** Unit: skipHistory picker (`useAppManager` + `explorerPickerStore` / `openExplorerPicker`)
- [x] **6.2** Unit: singleInstance media; multi uuid (`openWithRegistry` + `useAppManager`)
- [x] **6.3** Unit: complete/cancel закрывает picker (`explorerPickerStore.test.ts`)
- [x] **6.4** Smoke checklist составлен (`docs/TEST_REPORT.md`); UI пункты — manual pending
- [x] **6.5** Без коммита без просьбы

### DoD

- [x] Open → отдельный picker, close после выбора, файл в consumer *(auto: store/WM; UI — manual)*
- [x] Save As → отдельное окно, close, не в history *(auto; UI — manual)*
- [x] Reload: picker нет; consumers со своим файлом *(auto: skipHistory + documentPath restore; F5 — manual)*
- [x] 2+ explorer/notepad/markdown/image/archiver *(auto: explorer/notepad + path-key; UI siblings — manual)*
- [x] Audio/video — одно окно; повторный open грузит файл *(auto)*
- [ ] Dirty-close/save notepad & markdown OK *(manual pending; автотестов нет)*

### Hotfix после 6
- [x] Race replace open→open: cleanup сверяет `active.id === requestId` (`ownsActivePicker`)

---

## Итерация 7 — Per-window Explorer folder path

**Зависимости:** 3, 4 (механизм `WIN.documentPath`)  
**Субагент:** `developer` · `tester` после  
**Источник:** amendment в `docs/PLAN.md` (ранее Scope out)

- [x] **7.1** Hydrate: `props.documentPath` / WIN → `initialPath` ExplorerWorkspace (не общий last_path при restore)
- [x] **7.2** Persist: navigate → `setWindowDocumentPath(windowId, path)`; окна не затирают друг друга
- [x] **7.3** Fallback: `explorer.last_path` только для нового окна без WIN path; picker не пишет WIN folder
- [x] **7.4** Unit: 2 explorer → разные documentPath; restore оба; picker не трогает WIN explorers

### DoD iter 7

- [x] Два explorer A=`/foo`, B=`/bar` → reload → оба в своих папках *(unit: distinct WIN documentPath; UI F5 — manual)*
- [x] Новый Start Menu explorer — fallback last_path *(код: hydrateGlobal only without WIN path)*
- [x] Picker apps не пишут folder path в WIN history explorers *(unit: persistEnabled false)*
- [x] Без коммита

---

## Итерация 8 — Multi notepad/markdown: per-window file (amendment)

**Зависимости:** 3, 4  
**Субагент:** `developer` · `tester`  
**Источник:** user bugfix + amendment в `docs/PLAN.md`

**Диагноз (as-is):**
1. `openVfsPathWithApp` → `instanceKey = appId-path` + focus same path (контракт 0.4; для notepad нежелательно).
2. **Критично:** `explorerLaunchStore` / `useExplorerOpenFile(appId)` — pending по appId; уже открытый notepad **перехватывает** `setOpenRequest` нового файла и меняет свой path; новое окно тоже гидрится из path-key → оба на одном файле / теряется независимость.
3. `useExplorerSatelliteFile` → `useExplorerPickerResult(appId)` + `openExplorerPicker({ consumerAppId: appId })` — Open не scoped к windowId (Save As уже `${id}:${windowId}`).

- [x] **8.1** `openVfsPathWithApp`: для notepad/markdown — uuid instanceKey + передать path через `props.documentPath` (и WIN); **не** focus существующего по path; не полагаться на path-key. *(verify: code + openWithRegistry tests)*
- [x] **8.2** Launch/picker race: multi без `setOpenRequest`; Open picker `consumerAppId` = `explorerOpenPickerConsumerId(appId, windowId)`.
- [x] **8.3** markdown/image: тот же uuid + `documentPath`; media singleInstance без регрессии.
- [x] **8.4** Unit: 29/29 PASS (`openWithRegistry` 7, `explorerPickerStore` 9, `useAppManager` 13). Без commit.

### DoD iter 8

- [x] Разные файлы → разные независимые окна notepad/markdown *(auto; UI manual)*
- [x] Один файл → можно открыть во втором окне (не focus-only) *(auto)*
- [x] Reload → documentPath каждого окна восстановлен *(auto: restoreFromHistory / WIN; F5 — manual)*
- [x] Файл→Открыть / Start в окне меняет только это окно *(auto: window-scoped consumer; UI — manual)*
- [x] Без коммита
