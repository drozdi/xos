# Школа

Классы, параллели, предметы, расписание, домашние задания и доступ родителей.

Доступ: `ROLE_SCHOOLTASK`. Код: `server/src/SchoolTask`, `client/src/apps/schooltask-*`.

## Приложения

| ID | Экран |
|----|--------|
| schooltask-classes / schooltask-class | Классы и карточка |
| schooltask-subject | Предметы |
| schooltask-calendars | Список календарей классов |
| schooltask-calendar-editor | Редактор расписания класса |
| schooltask-calendar-teacher | Расписание учителя и файлы урока |
| schooltask-homeworks | Домашние задания |

Виджет `widget-school` показывает уроки учителя на сегодня и ходит в те же методы расписания.

Класс можно отдать родителю через shares. Домашние задания — `GET /api/schooltask/homework`. Файлы урока учитель загружает отдельно, скачивание — `GET /api/schooltask/files/{id}/download` с проверкой доступа.

Свой вход: `/api/schooltask/auth/login` и `/api/schooltask/token/refresh` (cookie `xos_app_refresh`). Стол входит общим `/api/login`.

См. [TZ.md](TZ.md), [API.md](API.md).
