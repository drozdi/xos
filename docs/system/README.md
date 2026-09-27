# Системные приложения

Приложения без отдельного backend-модуля или с минимальной интеграцией в `App`.

## Приложения

| ID | Название | Назначение | Backend |
|----|----------|------------|---------|
| settings | Settings | Настройки shell, тема, быстрый доступ | `/api/settings`, `/api/desktop-state` |
| shell-settings | Макет оболочки | layout + OU + **каталог виджетов** | USER settings |
| browser | Браузер | Встроенный браузер с прокси | `/api/browser/proxy` |
| chess…snake | Игры | Локальные игры | — |
| sticky-note | Стикер | Multi-instance заметки | localStorage |
| widget-clock | Часы | Desktop widget | `user_app_data` `widget.clock` |
| widget-weather | Погода | Desktop widget | `user_app_data` `widget.weather` |
| widget-reminders | Напоминания | Лента shell + локальные reminders | `widget.reminders` |
| demo-calculator | Calculator | Пример приложения | — |

## Виджеты на рабочем столе

- Манифест: `shellRole: 'widget'`, `showInTaskbar: false`, frameless (свой UI, ⚙/✕ по hover), стек справа сверху.
- Каталог: USER `desktop.widgets` → `[{ appId, instanceKey, enabled }]`.
- UX: ПКМ по пустому столу или секция в `shell-settings`.
- Закрытие виджета → `enabled: false` в каталоге; restore подхватывает enabled.

## Код

```
client/src/apps/settings/
client/src/apps/shell-settings/
client/src/apps/widget-*/
client/src/core/desktop/desktopWidgets.ts
client/src/core/desktop/DesktopSurface.tsx
```

## Доступ

Все приложения доступны любому авторизованному пользователю (`ROLE_USER`).

## Документы

- [TZ.md](TZ.md) — техническое задание
- [APPS.md](../APPS.md) — полный реестр
