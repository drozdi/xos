# XOS — План: Open/Save As pickers + instance rules

> Версия: 2026-08-07  
> Цель: отдельные read-only picker-apps (Open / Save As) вне `explorer` и `APP.launchHistory`; close after pick; правила multi/single instance; persist last opened; единый UX Open.  
> Формат: `- [ ]` для трекинга оркестратором.  
>
> **Предыдущий план** (desktop-state batch) — **DONE**  
> (см. `docs/ADR-desktop-state-batch.md`). Этот файл **заменён** под текущую задачу.  
> **Не коммитить** без явной просьбы пользователя.

## Легенда

- **Зависимости:** номера итераций, которые должны быть завершены
- **Параллельность:** `[‖]` — можно выполнять параллельно с указанным этапом
- **Субагент:** рекомендуемый исполнитель

---

## Сводка

| | |
|---|---|
| **Продукт** | Отдельные Open/Save pickers + instance rules для Explorer-satellite apps |
| **ADR** | **Не нужен** — контракт в секции ниже; опирается на `ADR-desktop-state-batch` / WIN / `skipHistory` |
| **As-is gap** | Picker = режим того же `explorer` (`singleInstance`) через `explorerPickerStore` + `launchApp('explorer')`; окно не закрывается; Start Menu → `instanceKey: 'default'` (фактически одно окно); path только in-memory (`pathByWindowId`); Open в контенте у audio/video/archiver; `useExplorerOpenFile` consume только на mount (media reload gap) |
| **Не ломать** | Dirty-close / Save / Save As notepad & markdown; desktop-state batch; CRUD settings/user-data; обычный Explorer FS CRUD |

### Scope (in)

1. Apps `explorer-open-picker` / `explorer-save-picker` (два appId, не mode-only), `skipHistory: true`, close after complete/cancel.
2. Обычный `explorer` без переключения в picker-mode (кроме picker-app).
3. Instance rules: multi explorer + satellites; single audio/video.
4. Persist last opened path per app/window; restore после reload.
5. Унификация меню Open → `openExplorerPicker`.
6. Тесты skipHistory / singleInstance / close picker.

### Scope out

- Полноценный FS CRUD в picker (только listing + выбор).
- Рефактор всего Explorer UI.
- Коммиты / PR без запроса.

### Amendment (2026-08-07) — Per-window Explorer folder path

> Ранее было в Scope out («уже out в UX sync»). Пользователь запросил явно: multi explorer → у каждого свой folder path в WIN, без затирания глобальным `explorer.last_path`.

| # | Решение |
|---|---------|
| **7.0** SoT | `WIN.documentPath` того же окна (`appId/windowId`), как у satellites (контракт 0.3). Не новый user-data code. |
| **7.0** Hot path | При навигации папки → `setWindowDocumentPath(windowId, folderPath)` (debounce через существующий WIN persist). |
| **7.0** Hydrate | `props.documentPath` / WIN при restore → `initialPath` ExplorerWorkspace. Глобальный `explorer.last_path` — только fallback для *нового* окна без WIN path (Start Menu). |
| **7.0** Picker | `explorer-open-picker` / `explorer-save-picker` **не** пишут folder path в WIN / history explorers. |
| **7.0** Не ломать | Satellite `documentPath` (файлы); dirty/save notepad & markdown. |

### Утверждённый контракт (Архитектор, 2026-08-07)

> Итерация 0 **DONE**. ADR `docs/ADR-explorer-pickers.md` **не** создаём — решения однозначны и укладываются в существующие ADR (desktop-state / WIN / skipHistory).

| # | Решение | Утверждено |
|---|---------|------------|
| **0.1** AppIds | **Два appId:** `explorer-open-picker`, `explorer-save-picker` (не один app + mode). Mode дублируется в `ExplorerPickerRequest.mode` и выбирается appId в `openExplorerPicker`. |
| **0.1** Manifest | `startMenu: false`, `startMenuList: false`, `singleInstance: true` на каждый picker-app (анти-дубликат окон); `skipHistory` на launch обязателен. |
| **0.1** Launch | `openExplorerPicker({ mode, … })` → `pickerAppId = mode === 'save' ? 'explorer-save-picker' : 'explorer-open-picker'` → `startPicker` → `launchApp(pickerAppId, { skipHistory: true, title, props: { requestId } })` → записать `pickerWindowId` в `active`. Сигнатура callers **без breaking changes**. |
| **0.2** Владелец `pickerWindowId` | **`explorerPickerStore.active.pickerWindowId`** (результат `launchApp`). UI/WM не хранят отдельно. |
| **0.2** Порядок close | **`completePicker`:** (1) `pendingResults[consumerAppId] = path` (2) снять `active` (3) `closeWindow(pickerWindowId)`. **`cancelPicker`:** (1) снять `active` (2) `closeWindow`. Deliver **до** close, чтобы consumer успел через `useExplorerPickerResult`. |
| **0.2** Повторный open / WM X | Новый `openExplorerPicker` при живом `active` → **replace:** `cancelPicker` (без result) + close старого, затем новый request. Закрытие крестиком WM → тот же `cancelPicker` (onClose / эквивалент). |
| **0.2** History | Picker **никогда** не в `APP.launchHistory`; `skipHistory: true`; restore не поднимает. |
| **0.3** Persist last file | **SoT: `WIN` `PersistedWindowState.documentPath?: string`** (ключ как сейчас `appId/windowId`). Входит в desktop-state batch без новых user-data codes. |
| **0.3** Hot path | In-memory `pathByWindowId` **оставить** (remount maximize). Писать в WIN при `setCurrentPath` (debounce через существующий window persist / лёгкий helper). |
| **0.3** Restore multi | `restoreFromHistory` → `launchApp(instanceKey)` → load WIN → **`openWindow.props.documentPath`** (не через одиночный `setOpenRequest` — он не масштабируется на N окон). Satellite читает: cache → `props.documentPath` → (open-with) path из `instanceKey` при необходимости. |
| **0.3** Не использовать | `user_app_data` для per-window file path; не класть path только в APP settings; не менять dirty/save notepad & markdown. Picker apps: path **не** persist / WIN orphan не нужен (окно закрывается). |
| **0.4** Explorer | `singleInstance: false`; Start / «Новое окно» → **uuid** `instanceKey` (не `'default'`). |
| **0.4** Multi satellites (notepad, markdown, image, archiver) | `singleInstance: false`. Start без файла → uuid. `openVfsPathWithApp` → `instanceKey = appId + '-' + vfsPath` + `setOpenRequest`. Уже открыт тот же path → **focus** существующего `windowId` (не слепой `openWindow`-overwrite). |
| **0.4** Audio / video | `singleInstance: true`, `instanceKey: 'default'`. `openVfsPathWithApp` → **не** path-key; `setOpenRequest` + `launchApp` (focus existing). **Обязательно:** mounted satellite **подписывается** на launch-store (`useExplorerOpenFile` сейчас consume только на mount — gap). |
| **0.4** `openVfsPathWithApp` | Ветка по `manifest.singleInstance` (или уже running с тем же windowId): media/reuse → fixed key + notify + focus; multi new → path-based key + launch. Title обновить; `WIN.documentPath` — iter 4. |

**Отклонено:** один picker-app + `props.mode` (хуже разделение title/taskbar/manifest); persist path в `user_app_data` (раздувает snapshot / гонки multi); SoT только `instanceKey` (Start→Open через picker не кодирует path в key без пересоздания окна).

---


## Ограничения и допущения

- `LaunchParams.skipHistory` уже есть (`useAppManager` / `launchHistory`) — расширять, не изобретать заново.
- `pendingResults` / `useExplorerPickerResult` / Save As consumer ids notepad/markdown — сохранить семантику.
- Picker UI: переиспользовать `ExplorerWorkspace` listing + `ExplorerPickerBar`, но **manifest отдельно**; мутации FS в picker — off (toolbar/context как сейчас в `pickerMode`).
- Desktop-state batch / `restoreFromHistory` не должны восстанавливать picker apps (следствие skipHistory + не писать в history).

---

## Текущие риски / выводы

| Риск | Митигация |
|------|-----------|
| Picker остаётся в history / WIN | Только `skipHistory`; close снимает WIN; тесты |
| Обычный explorer «залипает» в picker UI | Picker-mode только у picker-app / явный prop; store `active` не влияет на `explorer` |
| Start Menu multi ломается из‑за `instanceKey: 'default'` | Uuid при launch без файла; `openWindow` с тем же id перезаписывает окно |
| Audio/video + path-based `instanceKey` в `openVfsPathWithApp` | Ветка singleInstance: фиксированный key + reload file |
| Persist ломает dirty notepad | Не менять dirty/save flow; только path hydrate после restore |
| Два picker одновременно | **Replace:** `cancelPicker` + close предыдущего, затем новый request (см. контракт 0.2) |

---

## План (инкременты)

### Итерация 0 — Контракт Архитектора

**Зависимости:** —  
**Субагент:** `architect`

- [x] **0.1** Зафиксировать appIds (`explorer-open-picker` / `explorer-save-picker` vs один app + mode).
- [x] **0.2** Контракт close: кто держит `pickerWindowId`, порядок `completePicker` → deliver result → `closeWindow`.
- [x] **0.3** Контракт persist last path (WIN props vs APP/user-data vs instanceKey); multi-instance restore.
- [x] **0.4** Правила `openVfsPathWithApp` для singleInstance media vs multi satellites.
- [x] **0.5** (Опц.) короткий ADR — **пропущен** (контракт не спорный; достаточно PLAN).

**Проверка:** решения записаны в этом PLAN (секция «Утверждённый контракт»); оркестратор может стартовать итерацию 1.

---

### Итерация 1 — Picker apps + skipHistory + close after pick/cancel

**Зависимости:** 0  
**Субагент:** `developer` (TS) · `tester` после

- [ ] **1.1** Зарегистрировать manifests picker-apps (glob `apps/*/index.ts`); не в Start Menu.
- [ ] **1.2** Тонкие app shells → `ExplorerWorkspace` в picker-режиме (open/save).
- [ ] **1.3** `openExplorerPicker`: `launchApp(pickerAppId, { skipHistory: true, title, props.requestId })`; сохранить `pickerWindowId` в `active` (контракт 0.1–0.2).
- [ ] **1.4** `completePicker` / `cancelPicker` / WM X: порядок deliver → close; replace при повторном open.
- [ ] **1.5** Убедиться: picker не попадает в `APP.launchHistory`; reload не восстанавливает picker.

**Проверка:** Open/Save As открывает отдельное окно; выбор/отмена закрывает его; файл приходит consumer; history без picker; unit: launch с `skipHistory`.

---

### Итерация 2 — Отвязать picker-mode от обычного explorer

**Зависимости:** 1  
**Субагент:** `developer` · `tester`

- [ ] **2.1** Обычный `explorer`: не реагировать на `explorerPickerStore.active` (или active только для picker-app window).
- [ ] **2.2** Persist `explorer.last_path` не блокируется «чужим» picker; picker не пишет last_path explorer (как сейчас `persistEnabled: !picker` — уточнить scope).
- [ ] **2.3** Одновременная работа: открытый Проводник + Open picker consumer — без переключения UI проводника.

**Проверка:** ручной smoke — explorer остаётся обычным при Open из notepad; picker — отдельное окно.

---

### Итерация 3 — Instance rules (explorer + satellites + media)

**Зависимости:** 1 (2 желательно до/параллельно UI-smoke)  
**Субагент:** `developer` · `tester`

- [ ] **3.1** `explorer`: `singleInstance: false`; New / Start → уникальный `instanceKey`.
- [ ] **3.2** notepad, markdown, image-viewer, archiver: multi; Start без файла → uuid (не всегда `'default'`).
- [ ] **3.3** audio-player, video-player: `singleInstance: true`.
- [ ] **3.4** `openVfsPathWithApp` / launch: media → focus existing + load new file; multi → path/`uuid` instanceKey.
- [ ] **3.5** Context menu «Новое окно» / Start Menu согласованы с `singleInstance`.

**Проверка:** 2+ окна explorer/notepad/markdown/image/archiver; audio/video — максимум одно; повторный open media меняет файл в том же окне. Unit: singleInstance focus.

---

### Итерация 4 — Persist last opened file

**Зависимости:** 3  
**Субагент:** `developer` · `tester`

- [x] **4.1** Persisted path per app / window instance (согласованный в 0.3 механизм).
- [x] **4.2** После reload + `restoreFromHistory` consumer снова открывает тот же файл.
- [x] **4.3** Согласовать с multi-instance (`instanceKey` ± path); picker apps не restore.
- [x] **4.4** Не ломать dirty-close / save notepad & markdown (регрессия ручная + существующие тесты если есть).

**Проверка:** открыть файл → reload → файл на месте; два notepad с разными файлами → оба восстановлены; picker отсутствует.

---

### Итерация 5 — Унификация UX Open (audio / video / archiver)

**Зависимости:** 1 (можно `[‖]` после 1; идеально после 3)  
**Субагент:** `developer`

- [ ] **5.1** Убрать кнопку «Открыть…» из контента audio / video / archiver.
- [ ] **5.2** Меню **Файл → Открыть…** (как image/notepad/markdown) → тот же `openExplorerPicker`.
- [ ] **5.3** Hotkey Ctrl+O где уже принято в siblings.

**Проверка:** во всех consumer apps Open только из меню; один код-путь `openExplorerPicker`.

---

### Итерация 6 — Тесты и критерии готовности

**Зависимости:** 1–5  
**Субагент:** `tester` · `developer` (fixes)

- [x] **6.1** Unit: `skipHistory` для picker launch; history unchanged.
- [x] **6.2** Unit: `singleInstance` audio/video focus; multi explorer/notepad uuid keys.
- [x] **6.3** Unit/integration: complete/cancel закрывает picker window (mock WM).
- [x] **6.4** Smoke checklist составлен (`docs/TEST_REPORT.md`); UI — manual pending.
- [x] **6.5** Не коммитить без явной просьбы.

**Критерии готовности (DoD):**

- [x] Open → отдельное picker-окно, закрывается после выбора, файл в consumer *(auto + UI manual)*
- [x] Save As → отдельное окно, закрывается, не в history *(auto + UI manual)*
- [x] Reload: picker apps не восстанавливаются; consumers со своим файлом *(auto + F5 manual)*
- [x] 2+ explorer / notepad / markdown / image / archiver *(auto core; UI siblings manual)*
- [x] Audio/video — максимум одно окно каждое; повторный open грузит новый файл *(auto)*
- [ ] Dirty-close / save notepad & markdown без регрессий *(manual pending)*

---

## Релевантные файлы (ориентир)

- Picker: `explorerPickerStore.ts`, `ExplorerWorkspace.tsx`, `ExplorerPickerBar.tsx`, `useExplorerPickerResult.ts`, `useExplorerSatelliteFile.ts`, `useExplorerOpenFile.ts`
- Launch: `useAppManager.ts`, `launchHistory.ts`, `types.ts` (`skipHistory`, `singleInstance`, `instanceKey`), `openWithRegistry.ts`, `explorerLaunchStore.ts`, `desktopStatePersister.ts`
- Apps: `explorer`, `explorer-notepad`, `explorer-markdown-viewer`, `explorer-image-viewer`, `explorer-audio-player`, `explorer-video-player`, `explorer-archiver` (+ новые picker apps)
- Тесты: `useAppManager.test.ts`, `launchHistory.test.ts`

---

### Итерация 7 — Per-window Explorer folder path

**Зависимости:** 3, 4 (WIN.documentPath уже есть)  
**Субагент:** `developer` · `tester` после

- [x] **7.1** Hydrate: ExplorerWorkspace читает `props.documentPath` / WIN как `initialPath` (не общий last_path при restore).
- [x] **7.2** Persist: навигация папки → `setWindowDocumentPath` для этого `windowId`; не затирать path другого explorer.
- [x] **7.3** Fallback: глобальный `explorer.last_path` только для нового окна без WIN path; picker не пишет WIN folder path.
- [x] **7.4** Unit: два explorer window → разные documentPath; reload/restore сохраняет оба; picker не трогает WIN explorers.

**Проверка:** A=`/foo`, B=`/bar` → reload → оба в своих папках; Start Menu новый explorer — fallback last_path OK.

---

### Amendment (2026-08-07) — Multi text editors: always new window

> Пользователь: разные файлы в разных окнах notepad; один файл — тоже можно в двух окнах; не схлопывать. Контракт **0.4** (path-key + focus same path) для **notepad/markdown** отменяется в пользу uuid-per-launch.

| # | Решение |
|---|---------|
| **8.0** SoT | `WIN.documentPath` / `props.documentPath` per window (как 0.3). `instanceKey` = **uuid** на каждый openWith / Start (не `appId-path`). |
| **8.0** openWith | `openVfsPathWithApp` для multi **text** (notepad, markdown): всегда новое окно; **не** focus по path. Image/archiver — по желанию path-key+focus или тот же uuid (главное — не красть open у чужого окна). |
| **8.0** Launch race | `explorerLaunchStore` / `useExplorerOpenFile` не должны доставлять path во **все** окна одного appId. Либо target `windowId`, либо для multi достаточно `props.documentPath` при launch (без pending steal). |
| **8.0** Picker Open | `consumerAppId` scoped к **windowId** (как Save As), иначе File→Открыть заливает чужие окна того же appId. |
| **8.0** Restore | uuid instanceKey + WIN.documentPath → тот же файл после reload. |

### Итерация 8 — Fix multi notepad/markdown windows

**Зависимости:** 3, 4  
**Субагент:** `developer` · `tester`

- [x] **8.1** `openVfsPathWithApp`: notepad/markdown → uuid + `props.documentPath` (не path-key / не focus same).
- [x] **8.2** Устранить race: pending open / picker Open не шарятся между окнами одного appId.
- [x] **8.3** Persist/restore: каждое окно со своим `WIN.documentPath`; Start/Файл→Открыть меняет только текущее окно.
- [x] **8.4** Unit: 2 разных path → 2 окна; тот же path → 2 окна (text); picker Open только target window; media singleInstance без регрессии.

**Проверка:** два notepad с разными файлами независимы; reload восстанавливает оба; повторный open того же файла → новое окно (text).

---

## Следующие шаги

1. ~~Итерации 0–8~~ **DONE** (включая multi text editors windows).
2. UI smoke (два notepad, File→Open, F5) — manual.
3. **Без commit** до просьбы пользователя.
