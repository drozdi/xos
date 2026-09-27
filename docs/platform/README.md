# Platform — shell и инфраструктура клиента

Документы уровня desktop-shell, не привязанные к одному business-приложению.

## ADR (канон в ARCHITECTURE)

| Тема | Раздел | Статус |
|------|--------|--------|
| Desktop state batch | [ARCHITECTURE.md](../ARCHITECTURE.md) § Desktop state batch | DONE |
| Desktop UX sync | [ARCHITECTURE.md](../ARCHITECTURE.md) § Desktop UX sync | DONE |
| user_app_data KV | [ARCHITECTURE.md](../ARCHITECTURE.md) § user_app_data | DONE |

As-is wire: [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) § Desktop UX sync / Desktop state batch.  
Системные apps / widgets: [system/README.md](../system/README.md).

## Компоненты

| Область | Путь клиента |
|---------|--------------|
| Window Manager | `client/src/core/windowManager/` |
| App Manager | `client/src/core/appManager/` |
| Desktop / widgets | `client/src/core/desktop/` (`desktopWidgets.ts`, `widgetPrefs.ts`) |
| Desktop state | `client/src/core/settings/desktopStatePersister.ts` |
| Auth | `client/src/core/auth/` |
| Theme | `client/src/core/theme/` |

## API shell

| Endpoint | Назначение |
|----------|------------|
| `GET/PUT /api/desktop-state` | Snapshot USER/APP/WIN + `explorerLastPath` |
| `GET/PUT/DELETE /api/user-data` | KV prefs; optional — client `getOptional` (list+prefix) |
| `GET/PUT /api/settings` | Adhoc / non-desktop settings |
| `POST /api/login`, `/api/token/refresh` | JWT |

## Связанные документы

- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) — регистрация приложений, maniphest `shellRole` / `startMenuList`
- [system/README.md](../system/README.md) — settings, widgets, session
- [explorer/TZ.md](../explorer/TZ.md) — VFS / viewers
