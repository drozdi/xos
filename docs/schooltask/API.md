# API — школа

Префикс `/api/schooltask`. Роль `ROLE_SCHOOLTASK`.

## Сессия модуля

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/schooltask/auth/me` | Текущий пользователь модуля |
| POST | `/api/schooltask/auth/login` | Вход |
| GET | `/api/schooltask/auth/login` | Описание входа |
| POST | `/api/schooltask/auth/logout` | Выход |
| POST | `/api/schooltask/token/refresh` | Обновление токена |

## Классы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/schooltask/classes/list` | Список |
| POST | `/api/schooltask/classes` | Создать |
| GET | `/api/schooltask/classes/{id}` | Карточка |
| PUT | `/api/schooltask/classes/{id}` | Изменить |
| DELETE | `/api/schooltask/classes/{id}` | Удалить |
| POST | `/api/schooltask/classes/promote-all` | Перевести все |
| POST | `/api/schooltask/classes/{id}/promote` | Перевести класс |
| POST | `/api/schooltask/classes/{id}/graduate` | Выпустить класс |
| GET | `/api/schooltask/classes/parallels/options` | Параллели |
| GET | `/api/schooltask/classes/subjects/options` | Предметы |
| GET | `/api/schooltask/classes/tutors/options` | Тьюторы |
| GET | `/api/schooltask/classes/pupils/options` | Ученики |
| GET | `/api/schooltask/classes/{id}/shares` | Кому открыт класс |
| POST | `/api/schooltask/classes/{id}/shares` | Открыть |
| DELETE | `/api/schooltask/classes/{id}/shares/{shareId}` | Закрыть доступ |

## Параллели и предметы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/schooltask/parallels/list` | Список |
| POST | `/api/schooltask/parallels` | Создать |
| GET | `/api/schooltask/parallels/{id}` | Карточка |
| PUT | `/api/schooltask/parallels/{id}` | Изменить |
| POST | `/api/schooltask/parallels/{id}/promote` | Перевести |
| POST | `/api/schooltask/parallels/{id}/graduate` | Выпустить |
| POST | `/api/schooltask/subjects/list` | Предметы |
| POST | `/api/schooltask/subjects` | Создать предмет |
| GET | `/api/schooltask/subjects/{id}` | Карточка |
| PUT | `/api/schooltask/subjects/{id}` | Изменить |
| DELETE | `/api/schooltask/subjects/{id}` | Удалить |
| GET | `/api/schooltask/subjects/teachers/options` | Учителя предмета |
| POST | `/api/schooltask/members/sync` | Синхронизация участников |

## Расписание

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/schooltask/calendar/classes` | Классы для календаря |
| POST | `/api/schooltask/calendar/{classId}/info` | Сводка класса |
| POST | `/api/schooltask/calendar/{classId}/student/events` | События ученика |
| GET | `/api/schooltask/calendar/{classId}/student/events/{id}` | Событие ученика |
| POST | `/api/schooltask/calendar/{classId}/editor/events` | События редактора |
| POST | `/api/schooltask/calendar/{classId}/editor/subgroups` | Подгруппы |
| POST | `/api/schooltask/calendar/{classId}/editor/teachers` | Учителя |
| POST | `/api/schooltask/calendar/{classId}/editor/events/add` | Добавить |
| POST | `/api/schooltask/calendar/{classId}/editor/events/edit` | Изменить |
| POST | `/api/schooltask/calendar/{classId}/editor/events/remove` | Удалить |
| POST | `/api/schooltask/calendar/{classId}/editor/events/{id}` | Карточка в редакторе |
| GET | `/api/schooltask/calendar/lesson-templates` | Шаблоны уроков |
| POST | `/api/schooltask/calendar/teacher/files` | Файлы учителя |
| POST | `/api/schooltask/calendar/teacher/files/upload` | Загрузка |
| POST | `/api/schooltask/calendar/teacher/files/import` | Импорт |
| POST | `/api/schooltask/calendar/teacher/events` | События учителя |
| POST | `/api/schooltask/calendar/teacher/events/{id}` | Карточка |
| POST | `/api/schooltask/calendar/teacher/events/save` | Сохранить |
| GET | `/api/schooltask/files/{id}/download` | Скачать файл |
| GET | `/api/schooltask/homework` | Домашние задания |
