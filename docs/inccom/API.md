# API — доходы и расходы

Роль `ROLE_INCCOM`. Списки — `GET` с `page` и `size` либо `limit` и `offset`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET, POST | `/api/IncCom/accounts` | Счета |
| GET, PUT, PATCH, DELETE | `/api/IncCom/accounts/{id}` | Карточка |
| POST | `/api/IncCom/accounts/{id}/users` | Добавить участника |
| DELETE | `/api/IncCom/accounts/{id}/users/{userId}` | Снять участника |
| GET, POST | `/api/IncCom/accounts/{accountId}/categories` | Категории счёта |
| POST | `.../categories/copy` | Скопировать категории |
| PUT, PATCH, DELETE | `.../categories/{id}` | Правка |
| GET, POST | `/api/IncCom/transactions` | Операции |
| GET, PUT, PATCH, DELETE | `/api/IncCom/transactions/{id}` | Карточка |
| GET, POST | `/api/IncCom/transfers` | Переводы |
| GET, PUT, PATCH, DELETE | `/api/IncCom/transfers/{id}` | Карточка |
| GET, POST | `/api/IncCom/items` | Позиции |
| GET, PUT, PATCH, DELETE | `/api/IncCom/items/{id}` | Карточка |
| GET, POST | `/api/IncCom/item-categories` | Категории позиций |
| GET, PUT, PATCH, DELETE | `/api/IncCom/item-categories/{id}` | Карточка |
| GET, PUT, DELETE | `/api/IncCom/fns/credentials` | Доступ к ФНС |
| POST | `/api/IncCom/receipts/preview` | Разбор чека |
| POST | `/api/IncCom/transactions/{id}/receipt/fetch` | Подтянуть чек |
| POST | `/api/IncCom/transactions/{id}/receipt/apply-items` | Записать позиции |
