# Platform — shell и инфраструктура клиента

Документы уровня desktop-shell, не привязанные к одному business-приложению.

## ADR и планы

| Документ | Тема | Статус |
|----------|------|--------|
| [ADR-desktop-state-batch.md](../ADR-desktop-state-batch.md) | GET/PUT `/api/desktop-state`, debounce save | DONE |
| [ADR-desktop-ux-sync.md](../ADR-desktop-ux-sync.md) | Hydrate settings, explorer last_path | DONE |
| [ADR-user-app-data.md](../ADR-user-app-data.md) | KV `/api/user-data` для prefs приложений | DONE |

## Компоненты

| Область | Путь клиента |
|---------|--------------|
| Window Manager | `client/src/core/windowManager/` |
| App Manager | `client/src/core/appManager/` |
| Desktop state | `client/src/core/desktopState/` |
| Auth | `client/src/core/auth/` |
| Theme | `client/src/core/theme/` |

## API shell

| Endpoint | Назначение |
|----------|------------|
| `GET/PUT /api/desktop-state` | Snapshot окон и layout |
| `GET/POST/DELETE /api/user-data` | KV prefs (`code` + JSON `value`) |
| `GET/POST /api/settings` | Legacy settings adapter |
| `POST /api/login`, `/api/token/refresh` | JWT |

## Связанные документы

- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) — регистрация приложений
- [explorer/PLAN.md](../explorer/PLAN.md) — pickers (частично WM/documentPath)

> Исторические ссылки на `docs/PLAN.md` (desktop-state batch) перенесены сюда.
