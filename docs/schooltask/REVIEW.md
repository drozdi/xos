# Ревью модуля SchoolTask

**Дата:** 2026-07-17 (Critical закрыты Волной 2 — 2026-09-13)  
**Область:** `server/src/SchoolTask`, клиент `schooltask-*` / `features/schooltask`, PHPUnit, `@mantine/schedule`  
**Статус:** Critical (B1–B3, F1–F3) **исправлены** (Волна 2); High/Medium/Low — backlog

---

## Краткий вывод

Модуль собран по паттерну Device/Main и покрывает сценарий «предметы → классы → расписание → задания». Critical-пробелы Волна 2 закрыты; остаются High/Medium/Low ниже.

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

### B4. У `EpEventController` нет `#[Access]`
Только ручные проверки — риск пропущенного endpoint.  
**Предложение:** добавить class/method `Access` + сохранить membership/tutor-логику.

### B5. IDOR: `editorDetail` не сверяет `classId`
Можно запросить чужой `event id` при доступе к URL-классу.  
**Предложение:** как в student detail — `(int)$event->getClass()?->getId() === $classId`.

### B6. Редактирование серии сдвигает все даты в один слот
При `editType=all|after` в `buildEvent` одни и те же `start/end` пишутся во все вхождения.  
**Предложение:** менять не-датовые поля или сдвигать каждое вхождение на delta.

### B7. `can_create` / `can_delete` для event не используются — частично DONE (Волна 2)
Editor add/edit/remove разведены по `can_create` / `can_update` / `can_delete` (+ тьютор). Остальные пути могут ещё опираться на update.

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
- PHPUnit покрывает B1 (scope create) и B3 (uploads block + API download); B5–B6, multipart — ещё нет.

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
2. B5 (IDOR), B6 (серии), F4–F6 (access + pagination)
3. Medium/Low по приоритету продукта
4. Доп. PHPUnit (multipart, series)

---

*Документ сформирован по ревью кода на 2026-07-17.*
