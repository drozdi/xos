# STATUS — Desktop state batch

> Финал оркестрации 2026-08-06 · Источник: [platform/README.md](platform/README.md)

## Closed: предыдущие планы

- Desktop UX sync (hydrate/debounce/Explorer) — DONE · `ADR-desktop-ux-sync.md`
- `user_app_data` KV — DONE · `ADR-user-app-data.md`

## Desktop state batch — итог

Все итерации **0–4** завершены по scope. Product blockers нет.

| Итерация | Статус | Исполнитель |
|----------|--------|-------------|
| 0 ADR (A) | DONE | architect |
| 1 Backend GET/PUT | DONE | developer |
| 2 Client load/hydrate | DONE | developer |
| 3 Client debounce save | DONE | developer |
| 4 Regression / docs | DONE | tester |

## Как работает wire

| Операция | HTTP |
|----------|------|
| Hydrate shell (`VITE_USE_API_SETTINGS=true`) | **1×** `GET /api/desktop-state` |
| Save snapshot | **1×** `PUT /api/desktop-state` (debounce 2500 ms + flush unload) |
| Guest / flag off | без desktop-state HTTP |

Клиент: `desktopStateApi.load()` / `desktopStateApi.save(snapshot)` + `DesktopStatePersister`.

## Тесты

- PHPUnit target (DesktopState + Settings + UserData + Repo): **28/28**
- Vitest target (desktopState / settings / explorer / appManager / lifecycle): **53/53**
- Full PHPUnit / full Vitest: красные на **внешних** suites (не batch)

## Remaining (не блокеры)

1. Manual smoke PLAN 1–7 в двух браузерах / DevTools network
2. QA backlog: `ExplorerApiTest` (table already exists); auth/access vitest fails

## Артефакты

- ADR: `docs/ADR-desktop-state-batch.md`
- Tracking: [platform/README.md](platform/README.md), [explorer/TODO.md](explorer/TODO.md)
- Tests: `docs/TEST_REPORT.md`
- Apps: `docs/APPS.md` · API: `docs/API_SPEC.md` · Guide: `docs/DEVELOPER_GUIDE.md` · Arch: `docs/ARCHITECTURE.md`
