# XOS — Отчёт о тестировании

> Обновлено: 2026-08-06 · Iteration 4: desktop-state batch regression / docs / smoke  
> Источник: `docs/PLAN.md` § Итерация 4 + smoke checklist

## Итог

| Область | Результат |
|---------|-----------|
| Полный PHPUnit | **FAIL** — 116 tests: 84 pass, 5 fail, 27 errors |
| Целевой PHPUnit regression | **PASS** — 28/28 |
| Полный Vitest | **FAIL** — 258 tests: 247 pass, 11 fail |
| Целевой Vitest regression | **PASS** — 53/53 |
| Smoke manual | **pending** |

Целевая связка `desktop-state` green. Полные прогоны падают на уже существующих проблемах вне batch-wire.

---

## PHPUnit

Команда:

```bash
C:\OSPanel\modules\PHP-8.3\php.exe vendor/bin/phpunit
```

Результат полного прогона:

- **116 tests**
- **84 passed**
- **5 failed**
- **27 errors**

Наблюдения:

- `DesktopState` / `Settings` / `UserData` не упали.
- Основной blocker полного прогона: `ExplorerApiTest` ломается на повторном создании таблицы `explorer_user_disk` (`table already exists`).

Целевой regression-срез:

```bash
C:\OSPanel\modules\PHP-8.3\php.exe vendor/bin/phpunit \
  tests/Controller/DesktopStateApiTest.php \
  tests/Controller/SettingsApiTest.php \
  tests/Controller/UserDataApiTest.php \
  tests/Repository/UserAppDataRepositoryTest.php
```

Результат:

- **28 tests**
- **152 assertions**
- **28 passed**
- **0 failed**

Покрыто:

- `GET` / `PUT /api/desktop-state`
- orphan-delete для `WIN.*`
- omit-delete для USER allowlist и `APP.launchHistory`
- `explorerLastPath: null` delete semantics
- регрессия `/api/settings`
- регрессия `/api/user-data`

---

## Vitest

Команда:

```bash
npm test
```

Результат полного прогона:

- **44 test files**
- **258 tests**
- **247 passed**
- **11 failed**

Падения вне desktop-state:

- `src/core/auth/__tests__/coreScopes.test.ts`
- `src/core/auth/__tests__/sessionRestore.test.ts`
- `src/features/main/__tests__/mainAccess.test.ts`
- `src/features/device/__tests__/deviceAccess.test.ts`
- `src/features/schooltask/__tests__/schooltaskAccess.test.ts`

Целевой regression-срез:

```bash
npm test -- \
  src/core/settings/__tests__/createSettingAdapter.test.ts \
  src/core/settings/__tests__/desktopStatePersister.test.ts \
  src/core/settings/__tests__/CompositeAdapter.test.ts \
  src/core/api/endpoints/__tests__/desktopState.test.ts \
  src/features/explorer/explorerLastPath.test.ts \
  src/core/appManager/__tests__/launchHistory.test.ts \
  src/core/appManager/__tests__/useAppManager.test.ts \
  src/core/lifecycle/__tests__/pageLifecycle.test.ts
```

Результат:

- **8 files**
- **53 tests**
- **53 passed**
- **0 failed**

Покрыто:

- hydrate через `desktopStateApi.load()`
- clear-then-seed + server-first
- debounce **2500 ms** и flush
- guest / `VITE_USE_API_SETTINGS=false` без `desktop-state` HTTP
- Explorer local buffer
- `restoreFromHistory` / lifecycle
- запрет параллельного managed save через settings batch при sync

---

## ADR инварианты

| Инвариант | Статус | Основание |
|-----------|--------|-----------|
| Hydrate = 1x `GET /api/desktop-state` | **PASS (code/test)** | `client/src/App.tsx`, `createSettingAdapter.test.ts`, `desktopState.test.ts` |
| Нет обязательного `GET /api/settings` + explorer GET в shell hydrate | **PASS (code)** | shell preload идёт через `desktopStateApi.load()` |
| Save = 1x `PUT` snapshot после debounce | **PASS (test)** | `desktopStatePersister.test.ts` |
| Managed keys не идут через `setMany` / settings API при активном sync | **PASS (code/test)** | `CompositeAdapter.set/remove` route в `DesktopStatePersister` |
| Guest / API off без `desktop-state` HTTP | **PASS (test)** | `createSettingAdapter.test.ts`, `desktopStatePersister.test.ts` |
| CRUD `/api/settings` и `/api/user-data` не сломаны | **PASS (targeted PHPUnit)** | `SettingsApiTest`, `UserDataApiTest` |
| Orphan semantics покрыты PHPUnit | **PASS** | `DesktopStateApiTest` |

Остался только manual smoke на реальном UI/network.

---

## Smoke checklist

Условия: `VITE_USE_API_SETTINGS=true`, два профиля/браузера, один user.

| # | Сценарий | Статус | Комментарий |
|---|----------|--------|-------------|
| 1 | login → один `GET /api/desktop-state` | pending | вручную не выполнялось |
| 2 | mutate desktop → один `PUT /api/desktop-state` после 2500 ms | pending | debounce покрыт unit-тестом |
| 3 | B восстанавливает pinned/history/WIN/path | pending | hydrate/restore покрыты unit/integration |
| 4 | close window → следующий save без WIN key | pending | orphan-delete покрыт PHPUnit |
| 5 | guest / flag off без `/api/desktop-state` | pending | automated PASS |
| 6 | CRUD smoke `/api/settings` и `/api/user-data` | pending | automated PASS |

Manual smoke не выполнялся в UI harness; зафиксирован как pending, не как fail.

---

## Blockers

1. Полный `phpunit` не green из-за существующих падений `ExplorerApiTest` (`explorer_user_disk already exists`).
2. Полный `vitest` не green из-за существующих падений auth/access suites, не связанных с `desktop-state`.

---

## Заключение

- `desktop-state batch` regression на целевом наборе тестов пройден.
- Документация обновлена до текущего состояния реализации.
- Для финального закрытия iteration 4 нужен ручной smoke UI и отдельный разбор старых красных тестов полного прогона.
