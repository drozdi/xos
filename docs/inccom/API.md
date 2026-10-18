# API — доходы и расходы

Префикс `/api/IncCom`. Роль `ROLE_INCCOM`.

## Сессия

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/IncCom/auth/register` | Регистрация |
| GET | `/api/IncCom/auth/me` | Текущий пользователь |
| POST | `/api/IncCom/auth/login` | Вход |
| GET | `/api/IncCom/auth/login` | Описание входа |
| POST | `/api/IncCom/auth/logout` | Выход |
| POST | `/api/IncCom/token/refresh` | Обновление токена |

## Счета и категории

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/IncCom/accounts` | Список |
| POST | `/api/IncCom/accounts` | Создать |
| GET | `/api/IncCom/accounts/{id}` | Карточка |
| PUT, PATCH | `/api/IncCom/accounts/{id}` | Изменить |
| DELETE | `/api/IncCom/accounts/{id}` | Удалить |
| POST | `/api/IncCom/accounts/{id}/users` | Добавить участника |
| DELETE | `/api/IncCom/accounts/{id}/users/{userId}` | Убрать участника |
| GET | `/api/IncCom/accounts/{accountId}/categories` | Категории счёта |
| POST | `/api/IncCom/accounts/{accountId}/categories` | Создать категорию |
| POST | `/api/IncCom/accounts/{accountId}/categories/copy` | Скопировать категории |
| PUT, PATCH | `/api/IncCom/accounts/{accountId}/categories/{id}` | Изменить |
| DELETE | `/api/IncCom/accounts/{accountId}/categories/{id}` | Удалить |

## Операции и переводы

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/IncCom/transactions` | Список |
| POST | `/api/IncCom/transactions` | Создать |
| GET | `/api/IncCom/transactions/{id}` | Карточка |
| PUT, PATCH | `/api/IncCom/transactions/{id}` | Изменить |
| DELETE | `/api/IncCom/transactions/{id}` | Удалить |
| POST | `/api/IncCom/transactions/{id}/receipt/fetch` | Забрать чек |
| POST | `/api/IncCom/transactions/{id}/receipt/apply-items` | Разложить строки чека |
| GET | `/api/IncCom/transfers` | Переводы |
| POST | `/api/IncCom/transfers` | Создать |
| GET | `/api/IncCom/transfers/{id}` | Карточка |
| PUT, PATCH | `/api/IncCom/transfers/{id}` | Изменить |
| DELETE | `/api/IncCom/transfers/{id}` | Удалить |

## Номенклатура и ФНС

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/IncCom/items` | Номенклатура |
| POST | `/api/IncCom/items` | Создать |
| GET | `/api/IncCom/items/{id}` | Карточка |
| PUT, PATCH | `/api/IncCom/items/{id}` | Изменить |
| DELETE | `/api/IncCom/items/{id}` | Удалить |
| GET | `/api/IncCom/item-categories` | Категории номенклатуры |
| POST | `/api/IncCom/item-categories` | Создать |
| GET | `/api/IncCom/item-categories/{id}` | Карточка |
| PUT, PATCH | `/api/IncCom/item-categories/{id}` | Изменить |
| DELETE | `/api/IncCom/item-categories/{id}` | Удалить |
| GET | `/api/IncCom/fns/credentials` | Учётные данные ФНС |
| PUT | `/api/IncCom/fns/credentials` | Записать |
| DELETE | `/api/IncCom/fns/credentials` | Удалить |
| POST | `/api/IncCom/receipts/preview` | Предпросмотр чека |
