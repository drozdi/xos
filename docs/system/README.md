# Системные приложения

Приложения без отдельного backend-модуля или с минимальной интеграцией в `App`.

## Приложения

| ID | Название | Назначение | Backend |
|----|----------|------------|---------|
| settings | Настройки | Вкладки profile/date/shell/OU/widgets; `startMenuList: false` | account + desktop-state + user_app_data |
| shell-settings | Макет оболочки | Alias → `settings?tab=shell`; `startMenuList: false` | — |
| browser | Браузер | Встроенный браузер с прокси | `/api/browser/proxy` |
| chess…snake | Игры | Локальные игры | — |
| sticky-note | Стикер | Multi-instance заметки | `user_app_data` `sticky.*` (кэш localStorage) |
| widget-clock | Часы | Desktop widget | `user_app_data` `widget.clock` |
| widget-weather | Погода | Click expands details; drag ≥5px не открывает | `widget.weather` |
| widget-reminders | Напоминания | Локальные reminders на столе | `widget.reminders` |
| demo-calculator | Calculator | Пример приложения | — |

## Sync настроек и сессии

При `VITE_USE_API_SETTINGS=true` (auth):

- **USER / APP / WIN** (включая `desktop.widgets`) → `GET/PUT /api/desktop-state`.
- **Сессия окон:** `APP.launchHistory` + `WIN.{appId}/{windowId}` (позиция, min/max). Close → убрать из history и WIN; на другом ПК закрытое не восстанавливается.
- **OU / prefs виджетов** → `/api/user-data`; optional prefs — `userDataApi.getOptional` (list+prefix, без GET 404).

## Виджеты на рабочем столе

- Манифест: `shellRole: 'widget'`, `showInTaskbar: false`, `startMenuList: false`, frameless (⚙/✕ по hover), z-tier ниже окон.
- Каталог: USER `desktop.widgets` → вкладка «Виджеты» или ПКМ по столу.
- Закрытие виджета → `enabled: false` в каталоге.
- Weather: click по карточке ↔ expand; `dragStart` после ≥5px (WM) схлопывает details и подавляет click.

## Код

```
client/src/apps/settings/
client/src/apps/shell-settings/   # redirect alias
client/src/apps/widget-*/
client/src/core/desktop/desktopWidgets.ts
client/src/core/settings/desktopStatePersister.ts
```

## Доступ

Все приложения доступны любому авторизованному пользователю (`ROLE_USER`).

## Документы

- [TZ.md](TZ.md) — техническое задание
- [APPS.md](../APPS.md) — полный реестр
