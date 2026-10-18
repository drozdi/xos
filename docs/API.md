# API — продукт

Базовый URL — корень сервера. Кроме входа и обновления токена, методы требуют `Authorization: Bearer <access>`.

Ошибки: `400` с `message` и `violations`, `401` без токена, `403` без права, `404` если запись не найдена.

Схемы тел в OpenAPI не опубликованы. Полный перечень путей: `php bin/console debug:router` или `php bin/console app:openapi:dump` → `server/var/openapi.json`. API модулей — в `docs/<модуль>/API.md`.

## Вход

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/login` | Логин и пароль, выдаёт access-токен |
| GET | `/api/login-check` | Проверка, что сессия ещё жива |
| POST | `/api/token/refresh` | Новый access по refresh-токену |
| POST | `/api/logout` | Выход |
| GET | `/api/user` | Краткие данные текущего пользователя |
| GET | `/api/protected` | Проверка, что токен принят |
| GET | `/api/health` | Живость API |

У календаря, школы и IncCom есть собственные `POST /api/<модуль>/auth/login|logout` и `POST /api/<модуль>/token/refresh`. Рабочий стол пользуется общим `/api/login`.

## Аккаунт и права

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/account` | Текущий профиль |
| PUT, PATCH | `/api/account` | Правка профиля и пароля |
| GET | `/api/account/accesses` | Числовые scope пользователя |
| GET | `/api/account/map` | Карта claimants |
| GET | `/api/account/roles` | Роли текущего пользователя |
| GET | `/api/account/options` | Опции профиля |
| PUT, PATCH | `/api/account/options` | Запись опций |
| GET | `/api/scope/map` | Справочник claimants |
| GET | `/api/scope/accesses` | Справочник scope |

## Настройки стола

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/desktop-state` | Снимок USER, APP, WIN и последнего пути проводника |
| PUT | `/api/desktop-state` | Запись снимка |
| GET | `/api/settings` | Список ключей |
| GET | `/api/settings/{category}/{key}` | Один ключ |
| POST | `/api/settings` | Создать или заменить ключ |
| DELETE | `/api/settings/{category}/{key}` | Удалить ключ |

Категории снимка: `USER` (тема, виджеты, страница стола), `APP` (`launchHistory`), `WIN` (`{appId}/{windowId}`).

## Данные приложений

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/user-data` | Все ключи. Необязательный query `prefix` |
| GET | `/api/user-data/{code}` | Один ключ. Нет ключа — `404` |
| PUT | `/api/user-data` | Тело `{ code, value }` |
| DELETE | `/api/user-data/{code}` | Удалить ключ |

Клиент для необязательных ключей один раз читает весь список и дальше ищет в памяти.

## Файлы

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/main/file/upload` | `multipart`: поле `file` и `module` |
| GET | `/api/main/file/{id}` | Метаданные и скачивание по id |
| GET | `/uploads/{module}/{subDir}/{fileName}` | Прямая отдача загруженного файла |

`module` только из списка: `device`, `common`, `task`, `main`, `board`, `iblock`, `inbox`.

## Прочее оболочки

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/browser/proxy` | Прокси страницы встроенного браузера |

## Списки

Новые списки читают `page` и `size`. Старые каталоги (устройства, пользователи, инфоблоки) принимают в теле `limit`, `offset`, `sortBy`, `filters`. Разбор: `App\Http\PageQuery`.
