# TODO — Per-user app data KV (`user_id | code | value`)

> Источник: `docs/PLAN.md` (2026-08-06)  
> Defaults / OQ закрыты в `docs/ADR-user-app-data.md`.  
> **Оркестрация завершена** — все итерации 0–5 `[x]`.

## Defaults (open questions) — закрыты в ADR

1. `user_app_data` / `UserAppData` / `/api/user-data`
2. Один `code` `{appNs}.{key...}`
3. ROOT: нет чужих KV в MVP
4. Batch: single upsert MVP
5. Пилот 3.4 — отложено
6. `GET ?prefix=` сразу
7. Full replace only
8. code ≤191; value ≤64KB; soft 500 keys/user

---

## Итерация 0 — Контракт Архитектора · DONE

- [x] **0.1–0.5** ADR + schema/API drafts + ARCHITECTURE

---

## Итерация 1 — Backend entity/migration · DONE

- [x] **1.1** Migration `Version20260806100000`
- [x] **1.2** Entity + Repository
- [x] **1.3** `UserAppDataValidator`
- [x] **1.4** PHPUnit OK

---

## Итерация 2 — API CRUD · DONE

- [x] **2.1–2.4** `ApiUserDataController` + WebTest (isolation, 401)

---

## Итерация 3 — Frontend helper · DONE

- [x] **3.1** `userData.ts`
- [x] **3.2** Barrel
- [x] **3.3** vitest OK
- [x] **3.4** (optional) отложено

**Примечание:** `delete` → `deleteUserData` / `userDataApi.delete`

---

## Итерация 4 — Документация · DONE

- [x] **4.1–4.4** DATABASE_SCHEMA / API_SPEC / DEVELOPER_GUIDE / ARCHITECTURE  
- [x] Quality fix: пример импорта в DEVELOPER_GUIDE ↔ `userData.ts`

---

## Итерация 5 — Polish / regression · DONE (PASS)

- [x] **5.1** Regression Settings + user-data (PHPUnit 27/27)
- [x] **5.2** Лимиты покрыты тестами
- [x] **5.3** `TEST_REPORT.md` smoke checklist
- [x] Vitest 22/22
