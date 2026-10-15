# Оболочка

Стол, окна, «Пуск», панель задач, настройки и виджеты. Отдельного бизнес-модуля нет: состояние лежит в desktop-state и user-data.

## Приложения

| ID | Что это |
|----|---------|
| settings | Профиль, дата, макет, подразделение, виджеты. Только кнопка слева в «Пуске» |
| shell-settings | Открывает настройки на вкладке макета |
| browser | Страница через прокси |
| sticky-note | Несколько стикеров, текст в `sticky.*` |
| widget-clock | Время и пояс |
| widget-weather | Город, °C/°F, несколько городов, кэш 10 минут |
| widget-reminders | Локальные напоминания, повтор по дням |
| widget-upcoming | Лента сроков и писем |
| widget-today | Задачи на сегодня и серия привычек |
| widget-school | Уроки учителя на сегодня |
| widget-external | Issues GitHub и задачи TeamStorm |
| widget-explorer | Последний путь и закреплённые папки |
| chess … snake | Игры без сервера |

## Код

`client/src/core/windowManager`, `client/src/core/desktop`, `client/src/core/taskbar`, `client/src/apps/settings`, `client/src/apps/widget-*`.

См. [TZ.md](TZ.md), [API.md](API.md).
