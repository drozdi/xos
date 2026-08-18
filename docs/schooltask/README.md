# SchoolTask — школьное расписание

Предметы, классы, календари занятий, журнал учителя.

## Claimant

- **Код:** `schooltask`
- **Под-claimants:** `schooltask.subject`, `schooltask.class`, `schooltask.event`, `schooltask.zam`
- **Роль:** `ROLE_SCHOOLTASK`

## Приложения

| ID | Название | Тип | Описание |
|----|----------|-----|----------|
| schooltask-subjects | Предметы | regular | Справочник предметов |
| schooltask-subject | Предмет | sub-app | Карточка предмета |
| schooltask-classes | Классы | regular | Список классов/параллелей |
| schooltask-class | Класс | sub-app | Карточка класса, ученики |
| schooltask-calendars | Расписание | regular | Список календарей классов |
| schooltask-calendar | Календарь класса | sub-app | Просмотр сетки занятий |
| schooltask-calendar-editor | Редактор расписания | sub-app | Редактирование шаблона недели |
| schooltask-calendar-teacher | Мои уроки | regular | Календарь учителя, темы уроков |

## Backend

```
server/src/SchoolTask/
├── Controller/
│   ├── EpSubjectController.php    # /api/schooltask/subjects
│   ├── EpClassController.php
│   ├── EpEventController.php      # занятия
│   └── AuthController.php         # /api/schooltask/auth/me
└── setting.json
```

**API prefix:** `/api/schooltask/`

## Frontend

```
client/src/apps/schooltask-*/
client/src/features/schooltask/    # EventTeacherModal, LessonFilesPanel, …
```

Утилиты sub-app: `schooltaskAppUtils.ts`.

## Интеграция с Calendar

Приложение **Календарь** показывает overlay «Моё расписание» — события из `schooltaskCalendarApi.teacherEvents()` для пользователей с правами `schooltask.event`.

## Файлы уроков

`EventLessonFilesPanel` — прикрепление файлов из Explorer к занятию.

## Документы

- [REVIEW.md](REVIEW.md) — ревью и backlog
- [TZ.md](TZ.md) — техническое задание
