# XOS — Отчёт о тестировании

> Дата: 2026-07-14  
> Этап: 12 (PLAN.md)

## PHPUnit (server)

| Набор | Файл | Покрытие |
|-------|------|----------|
| Auth | `tests/Controller/AuthApiTest.php` | login, refresh, login-check, logout, `/api/user` |
| Settings | `tests/Controller/SettingsApiTest.php` | CRUD, изоляция user_id |
| Main users | `tests/Controller/MainUserApiTest.php` | POST `/api/main/user/list`, Content-Range |
| IBlock | `tests/Controller/IBlockApiTest.php` | CRUD block/element |

Запуск: `cd server && vendor/bin/phpunit`

## Vitest (client)

56+ тестов, включая:

- `SettingManager`, `CompositeAdapter`
- `parseView`
- `coreRoles`, `coreScopes`
- `auth` endpoints (Zod)
- `useAppManager`, `useWmStore`, `taskbarUtils`

Запуск: `cd client && npm run test`

## E2E Playwright

- `client/e2e/smoke.spec.ts` — login page + optional full flow
- Интеграционный тест: `E2E_INTEGRATION=true npm run test:e2e`

См. `client/e2e/README.md`

## Заключение

Автоматизированное покрытие критических модулей (auth, settings, users list, client core) выполнено. E2E full flow требует запущенного backend с тестовым пользователем.
