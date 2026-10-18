# Оболочка

Стол, окна, меню «Пуск», панель задач, настройки и виджеты. Отдельного бизнес-модуля нет: геометрия и предпочтения лежат в desktop-state и user-data.

Код: `client/src/core/windowManager`, `client/src/core/desktop`, `client/src/core/taskbar`, `client/src/apps/settings`, `client/src/apps/widget-*`.

## Приложения

| ID | Что это |
|----|---------|
| settings | Профиль, дата, макет, подразделение, виджеты. Кнопка слева в «Пуске», в списке программ нет |
| shell-settings | Открывает настройки на вкладке макета |
| browser | Страница через `GET /api/browser/proxy` |
| sticky-note | Несколько стикеров, текст в user-data `sticky.*` |
| widget-clock | Время и пояс |
| widget-weather | Город, °C/°F, несколько городов, кэш 10 минут |
| widget-reminders | Локальные напоминания, повтор по дням |
| widget-upcoming | Лента сроков и писем |
| widget-today | Задачи на сегодня и серия привычек |
| widget-school | Уроки учителя на сегодня |
| widget-external | Issues GitHub и задачи TeamStorm |
| widget-explorer | Последний путь и закреплённые папки |
| chess, solitaire, minesweeper, game-2048, sudoku, memory, snake, tic-tac-toe | Игры без сервера |
| demo-calculator | Калькулятор без сервера |

## Меню «Пуск»

Группы сортируются числом в `client/src/core/taskbar/startMenu/defaults.ts`. Сейчас: Администрирование, Система, Стандартные, Инфоблоки, Игры, Устройства и далее домены. Список программ и плитки «Быстрый доступ» занимают оставшуюся высоту панели, а не фиксированные 468 px.

Группа рисуется обычным списком. Виртуальный список для длинных групп не используется: внутри сворачиваемого блока он схлопывался в нулевую высоту.

См. [TZ.md](TZ.md), [API.md](API.md).
