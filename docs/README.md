# Документация XOS

XOS — рабочий стол в браузере: Symfony API и React-оболочка с окнами. Ниже индекс. Идеи, которые ещё не сделаны, лежат отдельно и не смешиваются с описанием того, что уже работает.

| Документ | Назначение |
|----------|------------|
| [TZ.md](TZ.md) | Техническое задание на продукт целиком |
| [API.md](API.md) | Общий API: вход, аккаунт, стол, настройки, файлы |
| [APP_IDEAS.md](APP_IDEAS.md) | Идеи новых приложений |
| [IMPROVEMENTS.md](IMPROVEMENTS.md) | Идеи улучшений существующих частей |

## Приложения

У каждого домена три файла: обзор, техническое задание, API. Пути взяты из `php bin/console debug:router`.

| Домен | README | ТЗ | API |
|-------|--------|----|-----|
| Оболочка | [system/README.md](system/README.md) | [system/TZ.md](system/TZ.md) | [system/API.md](system/API.md) |
| Администрирование | [main/README.md](main/README.md) | [main/TZ.md](main/TZ.md) | [main/API.md](main/API.md) |
| Устройства | [device/README.md](device/README.md) | [device/TZ.md](device/TZ.md) | [device/API.md](device/API.md) |
| Проводник | [explorer/README.md](explorer/README.md) | [explorer/TZ.md](explorer/TZ.md) | [explorer/API.md](explorer/API.md) |
| Школа | [schooltask/README.md](schooltask/README.md) | [schooltask/TZ.md](schooltask/TZ.md) | [schooltask/API.md](schooltask/API.md) |
| Инфоблоки и контент | [iblock/README.md](iblock/README.md) | [iblock/TZ.md](iblock/TZ.md) | [iblock/API.md](iblock/API.md) |
| Доходы и расходы | [inccom/README.md](inccom/README.md) | [inccom/TZ.md](inccom/TZ.md) | [inccom/API.md](inccom/API.md) |
| Календарь | [calendar/README.md](calendar/README.md) | [calendar/TZ.md](calendar/TZ.md) | [calendar/API.md](calendar/API.md) |
| Задачи | [todo/README.md](todo/README.md) | [todo/TZ.md](todo/TZ.md) | [todo/API.md](todo/API.md) |
| Доска | [board/README.md](board/README.md) | [board/TZ.md](board/TZ.md) | [board/API.md](board/API.md) |
| База знаний | [pkb/README.md](pkb/README.md) | [pkb/TZ.md](pkb/TZ.md) | [pkb/API.md](pkb/API.md) |
| TeamStorm | [ts/README.md](ts/README.md) | [ts/TZ.md](ts/TZ.md) | [ts/API.md](ts/API.md) |
| Почта | [inbox/README.md](inbox/README.md) | [inbox/TZ.md](inbox/TZ.md) | [inbox/API.md](inbox/API.md) |
| GitHub | [github/README.md](github/README.md) | [github/TZ.md](github/TZ.md) | [github/API.md](github/API.md) |
| Привычки | [habits/README.md](habits/README.md) | [habits/TZ.md](habits/TZ.md) | [habits/API.md](habits/API.md) |

Полный перечень путей без схем тел: `php bin/console app:openapi:dump` пишет `server/var/openapi.json`.
