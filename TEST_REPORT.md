# TEST_REPORT — 4.3 (+ чеклист 3.5/4.4)

**Дата:** 2026-08-06  
**Задача:** 4.3 security/access regression + помощь по smoke 3.5/4.4  
**Статус:** автоматизированная часть **green**; UI smoke — чеклист для пользователя

---

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

---

## Результаты

| Suite | Результат |
|-------|-----------|
| UserScopeResolverTest (9) | **PASS** — ROLE_ROOT / ROLE_MAIN / ROLE_MAIN_ROOT, scopes OR |
| ClaimantManagerSyncTest (9) | **PASS** — sync + idempotent + nested + invalid + orphan + **normalizeCanBit object/int** |
| ClaimantManagerExtraRolesTest (1) | **PASS** |
| DeviceApiTest (3) | **PASS** — 401 / 403 без scope / OK с ROLE_DEVICE + can_read |
| accessRulesUtils.test.ts (9) | **PASS** |

**Итого:** PHPUnit 22/22, Vitest 9/9. FAIL нет.

---

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

---

## Исправления только в тестах (продуктовый код не трогали)

1. DI: `ClaimantManager` требует `LoggerInterface` — обновлены Sync / ExtraRoles / UserScopeResolver tests.
2. `AuthWebTestCase`: уникальный email по login (иначе DeviceApi UNIQUE на `main_user.email`).
3. `DeviceApiTest`: для успешного list — `ROLE_USER` + `ROLE_DEVICE` (AccessSubscriber `checkRoles`).
4. Добавлен `testRuntimeNormalizeCanBitReadsObjectAndIntLeaves`.

---

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

---

## Рекомендации оркестратору / developer

- **4.1:** object + titles уже в модульных `setting.json` + `normalizeCanBit` — можно закрывать после сверки sync (4.2).
- **4.3:** авточасть закрыта.
- **3.5 / 4.4:** ждут браузерного smoke по чеклисту выше.
- Опционально: WebTestCase на `GET /api/main/claimant/app-access-modules` (структура `access_options`) — сейчас только unit + inspection.
