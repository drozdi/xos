# API — школа

| Метод | Путь | Назначение |
|-------|------|------------|
| POST, GET | `/api/schooltask/auth/login` | Вход стенда и описание |
| GET | `/api/schooltask/auth/me` | Текущий участник |
| POST | `/api/schooltask/auth/logout` | Выход |
| POST | `/api/schooltask/classes/list` | Классы |
| POST | `/api/schooltask/classes` | Создать |
| GET, PUT, DELETE | `/api/schooltask/classes/{id}` | Карточка |
| POST | `/api/schooltask/classes/promote-all` | Перевести все |
| POST | `/api/schooltask/classes/{id}/promote` | Перевести класс |
| POST | `/api/schooltask/classes/{id}/graduate` | Выпустить |
| GET, POST | `/api/schooltask/classes/{id}/shares` | Кто видит класс |
| DELETE | `/api/schooltask/classes/{id}/shares/{shareId}` | Забрать доступ |
| GET | `/api/schooltask/classes/parallels/options` и соседние `options` | Справочники формы |
| POST | `/api/schooltask/parallels/list` | Параллели |
| POST, GET, PUT | `/api/schooltask/parallels` и `/{id}` | Карточка |
| POST | `/api/schooltask/parallels/{id}/promote` и `/graduate` | Перевод параллели |
| POST | `/api/schooltask/subjects/list` | Предметы |
| POST, GET, PUT, DELETE | `/api/schooltask/subjects` | Карточка |
| GET | `/api/schooltask/subjects/teachers/options` | Учителя |
| POST | `/api/schooltask/members/sync` | Синхронизация участников |
| POST | `/api/schooltask/calendar/classes` | Классы календаря |
| POST | `/api/schooltask/calendar/{classId}/student/events` | События ученика |
| GET | `/api/schooltask/calendar/{classId}/student/events/{id}` | Одно событие |
| POST | `/api/schooltask/calendar/{classId}/editor/events` | События редактора |
| POST | `.../editor/events/add`, `/edit`, `/remove` | Правка |
| POST | `.../editor/events/{id}` | Карточка |
| POST | `.../editor/subgroups`, `.../editor/teachers` | Справочники урока |
| GET | `/api/schooltask/calendar/lesson-templates` | Шаблоны |
| POST | `/api/schooltask/calendar/teacher/events` | Интервал учителя |
| POST | `/api/schooltask/calendar/teacher/events/{id}` | Карточка |
| POST | `/api/schooltask/calendar/teacher/events/save` | Сохранить урок |
| POST | `/api/schooltask/calendar/teacher/files` | Файлы |
| POST | `.../files/upload`, `.../files/import` | Загрузка |
| GET | `/api/schooltask/homework` | Домашние задания |
| GET | `/api/schooltask/files/{id}/download` | Файл |
