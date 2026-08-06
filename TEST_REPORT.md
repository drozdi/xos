# TEST_REPORT — Итерация 5 (user_app_data polish / regression)

**Дата:** 2026-08-06  
**Задача:** 5.1–5.3 Regression + лимиты + smoke checklist для `/api/user-data`  
**Статус:** **PASS** — automated green; smoke checklist ниже

---

## Команды

```bash
# из server/
/c/OSPanel/modules/PHP-8.3/php.exe bin/phpunit \
  tests/Controller/UserDataApiTest.php \
  tests/Service/UserAppDataValidatorTest.php \
  tests/Repository/UserAppDataRepositoryTest.php \
  tests/Controller/SettingsApiTest.php \
  --testdox

# из client/
npx vitest run \
  src/core/api/endpoints/__tests__/userData.test.ts \
  src/core/api/endpoints/__tests__/account.test.ts \
  src/core/api/endpoints/__tests__/auth.test.ts
```

### Deploy / migrate

```bash
cd server
php bin/console doctrine:migrations:migrate
# миграция: Version20260806100000 — CREATE TABLE user_app_data
```

---

## Результаты (5.1)

| Suite | Tests | Результат |
|-------|------:|-----------|
| UserDataApiTest | 6 | **PASS** — auth, CRUD, isolation, limits 400 |
| UserAppDataValidatorTest | 10 | **PASS** — charset, length, size, soft quota 500 |
| UserAppDataRepositoryTest | 3 | **PASS** — upsert / prefix / unique |
| SettingsApiTest | 8 | **PASS** — `/api/settings` без регрессии |
| vitest `userData.test.ts` | 9 | **PASS** — schemas + helpers |
| vitest `account.test.ts` | 3 | **PASS** — account update schemas |
| vitest `auth.test.ts` | 10 | **PASS** |

**Итого:** PHPUnit **27/27**, Vitest **22/22**. FAIL нет.

Отдельного PHPUnit на `/api/account/options` в репо нет; соседний client `account.test.ts` зелёный. `User.options` semantics не затронуты реализацией KV.

---

## Лимиты (5.2)

| Правило | Где покрыто | Статус |
|---------|-------------|--------|
| code > 191 → 400 | `UserDataApiTest::testCodeTooLongReturns400` + Validator unit | OK |
| value > 64KB → 400 | `UserDataApiTest::testOversizedValueReturns400` + Validator unit | OK |
| invalid charset code → 400 | `UserDataApiTest::testInvalidCodeReturns400` + Validator unit | OK |
| soft quota 500 keys | `UserAppDataValidatorTest` (insert block / update allow) | OK |

Дополнять API-кейсы не потребовалось — пробелов нет.

---

## Smoke checklist (5.3) — user-data

### Migrate
1. `php bin/console doctrine:migrations:migrate` — применяется `Version20260806100000` (`user_app_data`).

### API smoke (auth JWT)
1. **PUT** `/api/user-data` `{ "code": "todo.ui.filters", "value": { "status": "open" } }` → 200, поля `code`/`value`/`createdAt`/`updatedAt`.
2. **GET** `/api/user-data/todo.ui.filters` → 200, тот же `value`.
3. **GET** `/api/user-data?prefix=todo.ui.` → `items` содержит ключ; чужой prefix — пусто/без него.
4. **DELETE** `/api/user-data/todo.ui.filters` → 204; повторный GET → 404.

### Isolation
- User B не видит и не удаляет ключи User A с тем же `code` (покрыто `testIsolationBetweenUsers`).
- Тело PUT с чужим `userId` игнорируется — пишется только CurrentUser.

### Фронт
- Helper `client/src/core/api/endpoints/userData.ts` — vitest: list/get/upsert/delete + Zod DTO/list.

### Не регрессировало
- **`/api/settings`** — SettingsApiTest 8/8 green (CRUD, isolation, invalid category, device legacy redirect).
- Account update Zod schemas — green (отдельного options API-suite нет).

---

## Вердикт

**Iteration 5: PASS**

---

# Архив — 4.3 (+ чеклист 3.5/4.4)

**Дата:** 2026-08-06  
**Задача:** 4.3 security/access regression + помощь по smoke 3.5/4.4  
**Статус:** автоматизированная часть **green**; UI smoke — чеклист для пользователя

## Команды

```bash
# из server/
/c/OSPanel/modules/PHP-8.3/php.exe bin/phpunit \
  tests/Security/UserScopeResolverTest.php \
  tests/Main/Service/ClaimantManagerSyncTest.php \
  tests/Main/Service/ClaimantManagerExtraRolesTest.php \
  tests/Controller/DeviceApiTest.php --testdox

# из client/
npx vitest run src/features/main/__tests__/accessRulesUtils.test.ts
```

## Результаты

| Suite | Результат |
|-------|-----------|
| UserScopeResolverTest (9) | **PASS** — ROLE_ROOT / ROLE_MAIN / ROLE_MAIN_ROOT, scopes OR |
| ClaimantManagerSyncTest (9) | **PASS** — sync + idempotent + nested + invalid + orphan + **normalizeCanBit object/int** |
| ClaimantManagerExtraRolesTest (1) | **PASS** |
| DeviceApiTest (3) | **PASS** — 401 / 403 без scope / OK с ROLE_DEVICE + can_read |
| accessRulesUtils.test.ts (9) | **PASS** |

**Итого:** PHPUnit 22/22, Vitest 9/9. FAIL нет.

## Матрица регрессии

| Сценарий | Как проверено | Статус |
|----------|---------------|--------|
| Sync idempotent | `testIdempotentSyncDoesNotDuplicateCodesAndKeepsOptionsStable` | OK |
| Nested map-access (`software.type`) | `testNestedSoftwareTypeGetsOptionsFromNestedMapAccess` | OK |
| Object leaf + int leaf runtime | `testRuntimeNormalizeCanBitReadsObjectAndIntLeaves` (`getCanScopeValue` / `getAccessesRoot`) | OK |
| Invalid bits abort | reject non-int / zero / broken object | OK |
| Orphan soft | options `{}`, запись не удаляется | OK |
| ROLE_*_ROOT bypass | UserScopeResolver `ROLE_MAIN_ROOT` / `ROLE_ROOT` | OK |
| Device access (роль + bit) | DeviceApiTest: нужен `ROLE_DEVICE` + level | OK |
| `/api/account/map` для authStore | Inspection: `authStore` / `hooks` всё ещё вызывают `getAccountMap`; вкладки User/Group — только `appAccessModules` | OK (не сломан контракт вкладок) |
| Object format без normalizeCanBit | **Не блокер:** `normalizeCanBit` уже в `ClaimantManager`; production `setting.json` уже object | N/A |

## Исправления только в тестах (продуктовый код не трогали)

1. DI: `ClaimantManager` требует `LoggerInterface` — обновлены Sync / ExtraRoles / UserScopeResolver tests.
2. `AuthWebTestCase`: уникальный email по login (иначе DeviceApi UNIQUE на `main_user.email`).
3. `DeviceApiTest`: для успешного list — `ROLE_USER` + `ROLE_DEVICE` (AccessSubscriber `checkRoles`).
4. Добавлен `testRuntimeNormalizeCanBitReadsObjectAndIntLeaves`.

## Чеклист ручного smoke (3.5 / 4.4)

### Деплой (4.4)
1. `php bin/console doctrine:migrations:migrate` (колонка `access_options`).
2. `php bin/console main:claimant:sync` (при bit-change — `--force`).
3. Убедиться: dry-run без неожиданных orphan/bit_changes.

### Admin UI (3.5)
1. Main → Пользователь → вкладка доступов: один запрос `app-access-modules` (Network), **нет** `account/map`.
2. Main / Device: подписи чекбоксов = `title` из API (русские).
3. Вкл/выкл чекбоксы → Save → переоткрыть: `level` биты те же.
4. То же для Группы.
5. Смена только `title` в setting.json → sync → UI обновляет подпись, level не меняется.
