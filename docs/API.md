# API — продукт

Базовый URL — корень сервера. Кроме входа, методы требуют `Authorization: Bearer <access>`.

Ошибки: `400` с `message` и `violations`, `401` без токена, `403` без права, `404` если запись не найдена.

## Вход

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/login` | Логин и пароль, выдаёт access-токен |
| POST | `/api/token/refresh` | Новый access по refresh-токену |
| POST | `/api/logout` | Выход |

## Аккаунт и права

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/account` | Текущий профиль |
| PUT | `/api/account` | Правка профиля и пароля |
| GET | `/api/account/accesses` | Числовые scope пользователя |
| GET | `/api/account/map` | Карта claimants |
| GET | `/api/scope` | Справочник scope |

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
| GET | `/api/main/file/{id}` | Метаданные |
| GET | `/api/main/file/{id}/download` | Содержимое |

`module` только из списка: `device`, `common`, `task`, `main`, `board`, `iblock`, `inbox`.

## Прочее оболочки

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/browser/proxy` | Прокси страницы встроенного браузера |

Полный перечень путей без схем тел: `php bin/console app:openapi:dump` пишет `server/var/openapi.json`.

API модулей — в `docs/<модуль>/API.md`.
