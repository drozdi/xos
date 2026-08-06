# STATUS — claimants access_options orchestration

> Старт / финал оркестрации: 2026-08-06  
> План: `docs/PLAN.md` · Трекинг: `docs/TODO.md`

## Итог

Оркестрация **завершена по коду и документации**. Остались только ручные UI-smoke пункты **3.5 / 4.4** (браузер пользователя) — не блокеры реализации.

| Итерация | Статус |
|----------|--------|
| 0 Контракт | `[x]` |
| 1 Backend migrate/sync | `[x]` |
| 2 Backend API | `[x]` |
| 3 Frontend tabs | `[x]` код; `[!]` 3.5 UI smoke |
| 4 setting.json + regression | `[x]` код/тесты; `[!]` 4.4 UI smoke |
| 5 Docs / polish | `[x]` |

## Defaults (без ответа пользователя)

1. Todo/IBlock — sync да, UI/Protected — нет  
2. map-access: number | `{bit,title}`; default titles  
3. Orphan soft — не delete, options `{}`  
4. Корневые can_* — на root claimant модуля  
5. Sync — только CLI + deploy (`server/update`)

## Автопроверки

- PHPUnit ClaimantManagerSync + UserScopeResolver + ExtraRoles + Device: **22/22** (по отчёту tester)
- vitest `accessRulesUtils`: **9/9**
- Sync prod: **30 upserted**, orphan soft: `class`, `root`, `subject`

## Артефакты

- `docs/ARCHITECTURE.md` — ADR  
- `docs/DATABASE_SCHEMA.md` — `access_options`  
- `docs/API_SPEC.md` — DTO + deprecation map для Admin UI  
- `docs/DEVELOPER_GUIDE.md` — claimant/can_* + sync  
- `docs/TEST_REPORT.md` — чеклист smoke  

## Блокеры для пользователя

1. **3.5 / 4.4** — открыть Main Admin User/Group Access: titles из API, save level, Network без `/api/account/map` при открытии вкладки. Чеклист: `docs/TEST_REPORT.md` / DEVELOPER_GUIDE.

## Журнал

- Этап 0 — architect: ADR, soft-orphan, CLI name, runtime=file / UI=DB  
- 1.1–1.5 — migration, entity, sync, CLI, PHPUnit  
- 2.1–2.4 — API access_options  
- 3.1–3.4 — Zod, utils, tabs без getAccountMap, vitest  
- 4.1–4.3 — object setting.json, normalizeCanBit, security green  
- 5.1–5.3 — DEVELOPER_GUIDE, deprecation, orphan docs  
