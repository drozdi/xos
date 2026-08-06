# TODO — права из setting.json → main_claimant → Main Admin UI

> Источник: `docs/PLAN.md` (2026-08-06)  
> Статусы: `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована  
> Обновляет: Оркестратор  
> Контракт: `docs/ARCHITECTURE.md` (ADR access_options), `DATABASE_SCHEMA.md`, `API_SPEC.md`

## Defaults (open questions PLAN → зафиксировано без ответа пользователя)

| # | Вопрос | Default |
|---|--------|---------|
| 1 | Todo / IBlock в ProtectedAppModules/UI | **НЕ включать** в ProtectedAppModules и вкладку «Доступ к приложениям», пока явно не попросят. Sync в `main_claimant` — да. |
| 2 | Формат описаний в setting.json | Поддержка **и** `can_*: number`, **и** `can_*: { bit, title[, description] }` в map-access. Дефолтные title для известных `can_*`, если title нет. |
| 3 | Orphan claimants | **soft-flag / не удалять** из БД при sync (запись остаётся; options можно обнулить `{}` или пометить). |
| 4 | Корневые can_* модуля | На **root claimant модуля** (напр. `device` → options с корневого map-access). |
| 5 | Sync | Только **CLI + шаг в deploy/docs**. Без ROOT endpoint в MVP. |

---

## Итерация 0 — Контракт Архитектора

**Зависимости:** нет · **Субагент:** architect

- [x] **0.1** Утвердить schema JSON `access_options` и эволюцию `setting.json`.
- [x] **0.2** Утвердить API response DTO для `app-access-modules` (+ list/detail).
- [x] **0.3** Политика orphan (soft) + runtime `getCanScopeValue` (file в MVP).
- [x] **0.4** Колонка `access_options`, CLI `main:claimant:sync`, шаг deploy.

**Проверка:** ADR + DATABASE_SCHEMA/API_SPEC — OK.

---

## Итерация 1 — Backend: миграция + entity + sync

**Зависимости:** 0 · **Субагент:** developer (+ tester PHPUnit)

- [x] **1.1** Doctrine migration: JSON `access_options` на `main_claimant`.
- [x] **1.2** Entity `Claimant` + `MainManager::claimant` options.
- [x] **1.3** `ClaimantManager::sync`: validate + upsert + orphan soft.
- [x] **1.4** Console `main:claimant:sync` (+ `server/update`).
- [x] **1.5** PHPUnit ClaimantManagerSyncTest 8+ green.

**Проверка:** migrate OK; sync 30 upserted; PHPUnit green.

---

## Итерация 2 — Backend: API для UI

**Зависимости:** 1.1–1.3 · **Субагент:** developer

- [x] **2.1** `access_options` в `app-access-modules` из БД.
- [x] **2.2** list/detail включают options.
- [x] **2.3** `/api/account/map` без изменений.
- [x] **2.4** API_SPEC совпадает с реализацией.

**Проверка:** smoke app-access-modules с options; map не тронут.

---

## Итерация 3 — Frontend: Main admin access tabs

**Зависимости:** 2.1 · **Субагент:** developer

- [x] **3.1** Zod `access_options` в `mainApi`.
- [x] **3.2** `accessRulesUtils` из options; legacy fallback.
- [x] **3.3** User/Group tabs: только `appAccessModules`.
- [x] **3.4** `CAN_SCOPE_LABELS` сужен; vitest 9/9.
- [!] **3.5** Ручной UI smoke (чеклист в TEST_REPORT.md) — **нужен браузер пользователя**.

**Проверка:** vitest green; getAccountMap убран из вкладок; 3.5 pending user.

---

## Итерация 4 — Обогащение setting.json + security regression

**Зависимости:** 1, 3 · **Субагент:** developer / tester

- [x] **4.1** Object `{bit,title}` во всех setting.json + `normalizeCanBit` в runtime.
- [x] **4.2** Повторный sync OK (30 upserted); UI сверка — см. 3.5.
- [x] **4.3** PHPUnit security 22/22 + vitest 9/9.
- [!] **4.4** Чеклист деплоя documented; полный smoke admin UI — **пользователь**.

**Проверка:** security green; titles в БД; UI smoke pending.

---

## Итерация 5 — Полировка и документация

**Зависимости:** 4 · **Субагент:** tech-writer / developer

- [x] **5.1** DEVELOPER_GUIDE: добавить claimant/can_* + sync.
- [x] **5.2** Deprecation notice: UI не использует `/api/account/map` как каталог прав.
- [x] **5.3** Orphan-report в sync (stdout) — проверить/дополнить docs.

**Проверка:** документированный путь: setting.json + sync → UI.

---

## Блокеры

- **3.5 / 4.4** — ручной browser smoke (не блокер кода; нужен пользователь).
