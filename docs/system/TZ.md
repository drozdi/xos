# ТЗ — Системные приложения

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Встроенные приложения desktop-shell без отдельного business-модуля Symfony: настройки, браузер, демо и игры.

## 2. Приложения

| ID | Название | Назначение |
|----|----------|------------|
| settings | Настройки | Вкладки profile/date/shell/OU/widgets; `startMenuList: false` |
| shell-settings | Alias | → `settings?tab=shell`; `startMenuList: false` |
| browser | Браузер | Просмотр web через server proxy |
| demo-calculator | Calculator | Пример для разработчиков |
| chess…snake | Игры | Локальные (см. APPS.md) |
| widget-* | Виджеты | clock / weather / reminders на столе |

## 3. Функциональные требования

### Settings
- Вкладки: профиль (account API), дата/время, макет оболочки, OU, виджеты
- Только левый сайдбар Пуска (`startMenuList: false`), не колонка «Все приложения»
- USER/APP/WIN через `desktopStateApi` при `VITE_USE_API_SETTINGS=true`
- Сессия: launchHistory + WIN (позиция, min/max); close убирает из обоих; закрытое не восстанавливается

### Widgets
- `shellRole: 'widget'`, frameless, каталог USER `desktop.widgets`
- Prefs в `user_app_data` (`widget.clock` / `widget.weather` / `widget.reminders`), чтение через `getOptional`
- Weather: click expands; drag ≥5px не открывает details

### Browser
- URL-строка, back/forward/reload
- Прокси `GET /api/browser/proxy?url=`
- Множественные окна (`singleInstance: false`)

### Игры / Calculator
- Полностью клиентская логика
- Без REST (кроме общего auth shell)

## 4. API

| Endpoint | Приложение |
|----------|------------|
| `/api/settings/*` | Settings |
| `/api/desktop-state` | Settings / WM |
| `/api/user-data` | Settings / apps prefs |
| `/api/browser/proxy` | Browser |

## 5. Доступ

Любой пользователь с `ROLE_USER`. Специальные claimants не требуются.

## 6. Критерии приёмки

- [x] Settings сохраняет тему и восстанавливает после reload
- [x] Settings / shell-settings не в «Все приложения»; виджеты — вкладка / ПКМ
- [x] Close окна синхронизирует launchHistory+WIN; widgets prefs через user-data
- [x] Browser открывает внешние URL через proxy
- [x] Игры запускаются из меню «Пуск»
- [x] demo-calculator — reference для DEVELOPER_GUIDE

## 7. Связанные документы

- [README.md](README.md)
- [platform/README.md](../platform/README.md)
