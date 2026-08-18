# ТЗ — Системные приложения

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Встроенные приложения desktop-shell без отдельного business-модуля Symfony: настройки, браузер, демо и игры.

## 2. Приложения

| ID | Название | Назначение |
|----|----------|------------|
| settings | Settings | Тема, prefs, desktop-state, быстрый доступ |
| browser | Браузер | Просмотр web через server proxy |
| demo-calculator | Calculator | Пример для разработчиков |
| chess | Шахматы | Локальная игра |
| tic-tac-toe | Крестики-нолики | Локальная игра |
| sudoku | Судоку | Локальная игра |

## 3. Функциональные требования

### Settings
- Загрузка/сохранение пользовательских настроек
- Переключение темы (light/dark)
- Управление pinned apps в меню «Пуск»
- Интеграция с `desktopStateApi` при `VITE_USE_API_SETTINGS=true`

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
- [x] Browser открывает внешние URL через proxy
- [x] Игры запускаются из меню «Пуск»
- [x] demo-calculator — reference для DEVELOPER_GUIDE

## 7. Связанные документы

- [README.md](README.md)
- [platform/README.md](../platform/README.md)
