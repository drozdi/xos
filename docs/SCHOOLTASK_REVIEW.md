# Ревью модуля SchoolTask

**Дата:** 2026-07-17  
**Область:** `server/src/SchoolTask`, клиент `schooltask-*` / `features/schooltask`, PHPUnit, `@mantine/schedule`  
**Статус:** замечания зафиксированы, исправления не внедрены

---

## Краткий вывод

Модуль собран по паттерну Device/Main и покрывает сценарий «предметы → классы → расписание → задания». Критичные пробелы: права (тьютор vs ROOT/scopes), публичные файлы заданий, битый save учителей предмета, multipart upload, недоступный UI редактора расписания.

---

## Critical

### B1. Мутации событий только для классного руководителя
**Где:** `EventManager::createEvent/editEvent/removeEvent`, `EpEventController::requireClassEditor`  
Контроллер пускает по `canUpdateSchooltaskEvent` **или** тьютору; сервис жёстко требует только тьютора → ROOT/scope-пользователь получает 400.  
**Предложение:** в EventManager разрешить тьютора **или** соответствующие scopes/ROOT; create → `can_create`, delete → `can_delete`.

### B2. Bypass тьютора для классов не работает
**Где:** `EpClassController` + `AccessSubscriber`  
`#[Access('can_read'|'can_update')]` срабатывает до проверки `isClassTutor`. Тьютор без scope `schooltask.class` не доходит до логики контроллера.  
**Предложение:** убрать method-level `Access` и оставить проверки в контроллере; либо расширить subscriber.

### B3. Файлы заданий доступны без авторизации
**Где:** `getFileSRC()` → `/uploads/task/...`, `security.yaml` `PUBLIC_ACCESS` для `/uploads/`  
**Предложение:** раздача через JWT API или signed URL; не отдавать `task` публично.

### F1. Сохранение учителей предмета ломает `user_ids`
**Где:** `SchooltaskSubjectApp.tsx` → `SchoolTaskManager::subject`  
В payload остаётся `users: [{user_id}]`, бэкенд берёт `users` и делает `intval` по объектам → неверные id.  
**Предложение:** отправлять только числовые `user_ids`, без `users`.

### F2. Multipart upload без boundary
**Где:** `schooltaskApi.teacherSave`  
Принудительный `Content-Type: multipart/form-data` без boundary ломает разбор FormData.  
**Предложение:** для FormData не задавать Content-Type (пусть axios выставит boundary).

### F3. Редактор расписания недоступен из UI
**Где:** `schooltask-calendar-editor` (`startMenu: false`), списки не вызывают `launchApp`  
**Предложение:** запуск из списка классов/календарей с `instanceKey = classId`.

---

## High

### B4. У `EpEventController` нет `#[Access]`
Только ручные проверки — риск пропущенного endpoint.  
**Предложение:** добавить class/method `Access` + сохранить membership/tutor-логику.

### B5. IDOR: `editorDetail` не сверяет `classId`
Можно запросить чужой `event id` при доступе к URL-классу.  
**Предложение:** как в student detail — `(int)$event->getClass()?->getId() === $classId`.

### B6. Редактирование серии сдвигает все даты в один слот
При `editType=all|after` в `buildEvent` одни и те же `start/end` пишутся во все вхождения.  
**Предложение:** менять не-датовые поля или сдвигать каждое вхождение на delta.

### B7. `can_create` / `can_delete` для event не используются
Add/edit/remove опираются на `can_update`.  
**Предложение:** развести глаголы прав.

### B8. Глобальный `can_read.schooltask.event` открывает любой класс
**Предложение:** для не-ROOT требовать membership / тьютора / учителя урока.

### F4. Frontend блокирует учеников/тьюторов, которых пускает backend
Студенческий календарь и editor требуют scopes; backend допускает `isClassMember` / `isClassTutor`.  
**Предложение:** выровнять `canAccess` и in-app checks с сервером.

### F5. Editor modal зависит от `schooltask.class` read
Учителя/подгруппы грузятся через `schooltaskClassApi.get`.  
**Предложение:** использовать `editor/subgroups` (+ teachers API) без class CRUD.

### F6. Subjects list: нет Content-Range + serverPagination
`total` ≈ длина страницы → ломается пагинация.  
**Предложение:** Content-Range + cnt, как в Device/Main, либо `limit: -1` без server pagination.

### F7. Teacher calendar: клик только при `canUpdate`
При `canRead` деталь не открывается.  
**Предложение:** read-only modal при read без update.

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
- PHPUnit не ловит B1–B3, B5–B6, multipart, membership без event scope.

---

## Что уже в порядке

- Doctrine mapping SchoolTask в `doctrine.yaml`, routes/services подключены.
- `GroupMeta` (PK = group_id) соответствует выбранной модели.
- Клиент: манифесты, `wmGroup: schooltask`, группа «Школа» в Start Menu.
- `@mantine/schedule` WeekView + styles в `main.tsx`.
- Цвета событий green/blue/orange согласованы с backend.

---

## Рекомендуемый порядок исправлений

1. F1 (user_ids), F2 (FormData), B1–B2 (права тьютор/ROOT/Access)  
2. B3 (файлы), F3 (launch editor), B5 (IDOR)  
3. B6 (серии), F4–F6 (access + pagination)  
4. Тесты PHPUnit на критичные сценарии  
5. Medium/Low по приоритету продукта

---

*Документ сформирован по ревью кода на 2026-07-17.*
