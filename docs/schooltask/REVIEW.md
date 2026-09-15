# Ревью модуля SchoolTask

**Дата:** 2026-07-17 (Critical закрыты Волной 2 — 2026-09-13)  
**Область:** `server/src/SchoolTask`, клиент `schooltask-*` / `features/schooltask`, PHPUnit, `@mantine/schedule`  
**Статус:** Critical (B1–B3, F1–F3) **исправлены** (Волна 2); High (B4–B8, F4–F7) **исправлены**

---

## Краткий вывод

Модуль собран по паттерну Device/Main и покрывает сценарий «предметы → классы → расписание → задания». Critical и High закрыты; остаются Medium/Low ниже.

---

## Critical

### B1. Мутации событий только для классного руководителя — DONE
**Где:** `EventManager::createEvent/editEvent/removeEvent`, `EpEventController::requireClassEditor`  
Тьютор **или** scopes/ROOT (`can_create` / `can_update` / `can_delete`).

### B2. Bypass тьютора для классов не работает — DONE
**Где:** `EpClassController` + `AccessSubscriber`  
`show`/`update`: `#[Access(..., checkScopes: false)]`; subscriber учитывает method opt-out.

### B3. Файлы заданий доступны без авторизации — DONE
**Где:** было `/uploads/task/...`  
Раздача через `GET /api/schooltask/files/{id}/download`; `/uploads/task/` запрещён.

### F1. Сохранение учителей предмета ломает `user_ids` — DONE
Payload: числовые `user_ids` (без `users` в save).

### F2. Multipart upload без boundary — DONE
FormData без принудительного `Content-Type`.

### F3. Редактор расписания недоступен из UI — DONE
Запуск `schooltask-calendar-editor` из списков классов/календарей.

---

## High

### B4. У `EpEventController` нет `#[Access]` — DONE
Class/method `Access` + `checkScopes: false` где нужен bypass тьютора/членства; ручные проверки сохранены.

### B5. IDOR: `editorDetail` не сверяет `classId` — DONE
`(int)$event->getClass()?->getId() === $classId` (как student detail).

### B6. Редактирование серии сдвигает все даты в один слот — DONE
При `editType=all|after` сдвиг каждого вхождения на delta от якоря.

### B7. `can_create` / `can_delete` для event не используются — DONE
Editor add/edit/remove по `can_create` / `can_update` / `can_delete` (+ тьютор); `can_edit` в списке классов учитывает create/update/delete.

### B8. Глобальный `can_read.schooltask.event` открывает любой класс — DONE
Не-ROOT: только membership / тьютор / учитель урока (`isClassLessonTeacher`).

### F4. Frontend блокирует учеников/тьюторов, которых пускает backend — DONE
`canAccessSchooltaskCalendars` (модуль или event scopes); манифесты и `SchooltaskCalendarsApp` выровнены.

### F5. Editor modal зависит от `schooltask.class` read — DONE
`editor/subgroups` отдаёт `subject_id`/`user_id`; modal без `schooltaskClassApi.get`.

### F6. Subjects list: нет Content-Range + serverPagination — DONE
`Content-Range` + `cnt` в `EpSubjectController::list`.

### F7. Teacher calendar: клик только при `canUpdate` — DONE
Деталь открывается при read; save по-прежнему для владельца урока.

---

## Medium

| ID | Тема | Предложение |
|----|------|-------------|
| B9 | `x_timestamp` DATETIME vs TIMESTAMP в миграции | Выровнять entity ↔ migration |
| B10 | Multipart teacher save хрупкий | Унифицировать разбор body; тест с UploadedFile |
| B11 | `getClassGroup` не проверяет «это класс» | `isClassGroup` на write-путях |
| B12 | Несуществующий `subject_id` → пустой EpSubject | null/404 вместо `new EpSubject()` |
| B13 | Recurring: orphan children, мало тестов | Политика cascade + PHPUnit на `repeate`/`editType` |
| B14 | `group_id` не обязан быть child класса | Assert parent = class |
| B15 | `/calendar/classes` только при event read | Фильтр по membership для учеников |
| F8 | Нет `repeate` и валидации слота в UI | «Повторять до» + required group/start&lt;end |
| F9 | Class form: пустые subgroup без subject | Валидация строк sub |
| F10 | Нет error/empty state в календарях | Alert на isError, пустая неделя |
| F11 | XSS: `dangerouslySetInnerHTML` на ht/pt | Текст / sanitize |
| F12 | `POST .../subjects/` trailing slash | Как у classes — без `/` |

---

## Low

- Пустая папка `server/src/SchoolTask/DBAL/` — удалить.
- Join-таблицы без префикса `st_` — косметика.
- `sort ?: 100` трактует `0` как 100.
- Неиспользуемые `nextTempId`, `schooltaskEndpoints`.
- SchoolTask не в `DEFAULT_PINNED_APPS` (опционально).
- PHPUnit: B1 (scope create), B3 (uploads), B5 (editorDetail IDOR), B8 (scoped read без membership).

---

## Что уже в порядке

- Doctrine mapping SchoolTask в `doctrine.yaml`, routes/services подключены.
- `GroupMeta` (PK = group_id) соответствует выбранной модели.
- Клиент: манифесты, `wmGroup: schooltask`, группа «Школа» в Start Menu.
- `@mantine/schedule` WeekView + styles в `main.tsx`.
- Цвета событий green/blue/orange согласованы с backend.

---

## Рекомендуемый порядок исправлений

1. ~~Critical B1–B3 / F1–F3~~ — DONE (Волна 2; см. `docs/ROADMAP_WAVES.md`)
2. ~~High B4–B8 / F4–F7~~ — DONE
3. Medium/Low по приоритету продукта
4. Доп. PHPUnit (multipart, series)

---

*Документ сформирован по ревью кода на 2026-07-17.*
