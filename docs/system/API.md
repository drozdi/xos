# API — оболочка

Общие методы — в [../API.md](../API.md). Здесь то, чем пользуется стол.

## Состояние

| Метод | Путь | Назначение |
|-------|------|------------|
| GET, PUT | `/api/desktop-state` | USER, APP, WIN, `explorerLastPath` |
| GET | `/api/user-data?prefix=` | Prefs виджетов, стикеров, календаря |
| PUT | `/api/user-data` | Запись prefs |

Ключи: `widget.clock`, `widget.weather`, `widget.reminders`, `sticky.{instance}`, `calendar.visibility`, `explorer.pins`, `explorer.last_path`, `desktop.widgets`, `desktop.page`, `desktop.widgetSnap`.

## Браузер

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/browser/proxy` | HTML страницы по query URL |

Погода ходит во внешний Open-Meteo с клиента, не через этот API.
