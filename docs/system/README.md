# Системные приложения

Приложения без отдельного backend-модуля или с минимальной интеграцией в `App`.

## Приложения

| ID | Название | Назначение | Backend |
|----|----------|------------|---------|
| settings | Settings | Настройки shell, тема, быстрый доступ | `/api/settings`, `/api/desktop-state` |
| browser | Браузер | Встроенный браузер с прокси | `/api/browser/proxy` |
| chess | Шахматы | Локальная игра | — |
| tic-tac-toe | Крестики-нолики | Локальная игра | — |
| sudoku | Судоку | Локальная игра | — |
| demo-calculator | Calculator | Пример приложения для разработчиков | — |

## Код

```
client/src/apps/settings/
client/src/apps/browser/
client/src/apps/chess/
client/src/apps/tic-tac-toe/
client/src/apps/sudoku/
client/src/apps/demo-calculator/
```

## Доступ

Все приложения доступны любому авторизованному пользователю (`ROLE_USER`). Игры и demo-calculator не требуют специальных прав.

## Settings

- Загрузка/сохранение настроек пользователя и desktop-state
- Управление темой (светлая/тёмная)
- Быстрый доступ к приложениям в меню «Пуск»

## Browser

- Адресная строка, навигация
- Прокси-запросы через сервер (`BrowserProxyController`) для обхода CORS
- Множественные экземпляры (`singleInstance: false`, `instanceKey` по timestamp)

## Игры

Полностью клиентские, без API. Используются как примеры UI и window manager.

## Документы

- [TZ.md](TZ.md) — техническое задание
