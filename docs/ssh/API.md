# API — SSH

Префикс `/api/ssh`. Роль `ROLE_SSH`, кроме `redeem` и `release`.

## Подключения

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ssh/connections` | Свои подключения, без секрета |
| POST | `/api/ssh/connections` | Создать. Тело: `name`, `host`, `port`, `username`, `auth`, `secret` или `key_id`, опционально `passphrase` |
| PUT | `/api/ssh/connections/{id}` | Изменить. Пустой `secret` пароль не затирает |
| DELETE | `/api/ssh/connections/{id}` | Удалить |

## Ключи

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ssh/keys` | Свои ключи |
| POST | `/api/ssh/keys` | Импорт |
| POST | `/api/ssh/keys/generate` | Сгенерировать пару |
| DELETE | `/api/ssh/keys/{id}` | Удалить |

## Шлюз

| Метод | Путь | Кто вызывает | Назначение |
|-------|------|--------------|------------|
| POST | `/api/ssh/gateway/ticket` | Браузер с JWT | Тело `{ connection_id }`. Билет на 30 секунд |
| POST | `/api/ssh/gateway/redeem` | Шлюз | Тело `{ ticket }`, заголовок `X-Gateway-Secret`. Параметры одного подключения |
| POST | `/api/ssh/gateway/release` | Шлюз | Тело `{ user_id }`, тот же заголовок. Снимает слот сессии |

`redeem` и `release` не требуют JWT.

## Поток без шлюза

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/ssh/sessions` | Открыть сессию по `connection_id` |
| GET | `/api/ssh/sessions/{id}/stream` | Вывод. `id` — 32 hex |
| POST | `/api/ssh/sessions/{id}/input` | Ввод |
| DELETE | `/api/ssh/sessions/{id}` | Закрыть |
