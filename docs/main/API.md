# API — администрирование

Префикс `/api/main`. Роль `ROLE_MAIN`, кроме выборок, которые контроллер открывает другим модулям (`user/select`, `ou/select`).

Списки без явного метода (`ANY`): `/list` и `/filter` принимают GET и POST. Тело списка — `limit`, `offset`, `sortBy`, `filters`.

## Пользователи

| Метод | Путь | Назначение |
|-------|------|------------|
| ANY | `/api/main/user/list` | Список |
| ANY | `/api/main/user/filter` | Фильтр колонок |
| GET | `/api/main/user/role-options` | Роли для формы |
| POST | `/api/main/user/select` | Выбор пользователя |
| POST | `/api/main/user/` | Создать |
| GET, HEAD | `/api/main/user/{id}` | Карточка |
| PUT | `/api/main/user/{id}` | Изменить, включая пароль и роли |
| DELETE | `/api/main/user/{id}` | Удалить |

## Группы

| Метод | Путь | Назначение |
|-------|------|------------|
| ANY | `/api/main/group/list` | Список |
| ANY | `/api/main/group/filter` | Фильтр |
| POST | `/api/main/group/` | Создать |
| GET, HEAD | `/api/main/group/{id}` | Карточка |
| PUT | `/api/main/group/{id}` | Изменить |
| DELETE | `/api/main/group/{id}` | Удалить |

## Подразделения

| Метод | Путь | Назначение |
|-------|------|------------|
| ANY | `/api/main/ou/list` | Список |
| POST | `/api/main/ou/select` | Выбор для селекта |
| POST | `/api/main/ou/` | Создать |
| GET, HEAD | `/api/main/ou/{id}` | Карточка |
| PUT | `/api/main/ou/{id}` | Изменить |
| DELETE | `/api/main/ou/{id}` | Удалить |

## Права и журнал

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/main/claimant/access-rules` | Правила доступа |
| GET | `/api/main/claimant/app-access-modules` | Модули с защитой приложения |
| ANY | `/api/main/claimant/list` | Список claimants |
| POST | `/api/main/claimant/` | Создать |
| GET, HEAD | `/api/main/claimant/{id}` | Карточка |
| PUT | `/api/main/claimant/{id}` | Изменить |
| DELETE | `/api/main/claimant/{id}` | Удалить |
| GET, POST | `/api/main/audit/list` | Журнал |

## Файлы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/main/file/upload` | `multipart`: `file`, `module` |
| GET | `/api/main/file/{id}` | Метаданные и скачивание |
| GET | `/uploads/{module}/{subDir}/{fileName}` | Отдача файла с диска |
