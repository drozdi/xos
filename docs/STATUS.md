# STATUS — Per-user app data KV

> Финал оркестрации 2026-08-06

## Итог

Все итерации **0–5** завершены. Blockers нет.

| Итерация | Статус | Исполнитель |
|----------|--------|-------------|
| 0 ADR/контракт | DONE | architect |
| 1 Entity/migration | DONE | developer |
| 2 API CRUD | DONE | developer |
| 3 Frontend helper | DONE | developer |
| 4 Docs | DONE | tech-writer |
| 5 Regression | PASS | tester |

## Тесты (итог iter 5)

- PHPUnit: 27/27 (UserData + Validator + Repository + Settings)
- Vitest: 22/22 (userData + account + auth)

## Ручные шаги

1. На MySQL/dev: `php bin/console doctrine:migrations:migrate --no-interaction` (`Version20260806100000`)
2. Опциональный UI smoke / пилот приложения (3.4) — отложен, не блокер

## Отклонения (приняты)

- Client: `delete` → `deleteUserData` / `userDataApi.delete` (reserved word)
- Batch upsert — не в MVP (по ADR)

## Артефакты

- ADR: `docs/ADR-user-app-data.md`
- Schema: `docs/DATABASE_SCHEMA.md`
- API: `docs/API_SPEC.md`
- Guide: `docs/DEVELOPER_GUIDE.md`
- Architecture: `docs/ARCHITECTURE.md`
- Tests: `TEST_REPORT.md`
- Tracking: `docs/TODO.md`
