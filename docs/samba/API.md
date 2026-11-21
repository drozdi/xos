# API Samba

Нужна роль `ROLE_SAMBA`. Чужой сервер без права просмотра отвечает 404. Тела — JSON. Ошибки: `400` с `message`, `401`, `403`, `404`.

## Серверы

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/samba/servers` | Свои серверы и серверы с выданным доступом |
| POST | `/api/samba/servers` | Создать. Тело: `name`, `description`, `role` (`ad_dc`), `file`, `expected_timezone`, `agent_url` |
| GET | `/api/samba/servers/{id}` | Карточка. Список выдач только у владельца. Токен наружу не отдаётся, есть `agent_token_set` |
| PUT | `/api/samba/servers/{id}` | Изменить. Только владелец. Поле токена этим методом не затирается |
| DELETE | `/api/samba/servers/{id}` | Удалить. Только владелец. Ответ 204 |
| POST | `/api/samba/servers/{id}/access` | Выдать доступ: `user_id`, `rights` (`view`, `shares`, `directory`, `provision`, `manage`) |
| DELETE | `/api/samba/servers/{id}/access/{userId}` | Отозвать |
| POST | `/api/samba/servers/{id}/transfer` | Передать владение: `user_id` |
| GET | `/api/samba/servers/{id}/log` | Журнал. Только владелец |
| POST | `/api/samba/servers/{id}/agent-token` | Сменить токен установки. Только владелец. Новый токен попадёт в агент при следующей сборке архива |
| POST | `/api/samba/servers/{id}/enrollment` | Одноразовый секрет установки на 30 минут. Только владелец |

`agent_url` — `http://хост:порт` или `https://хост:порт`, без логина в адресе. Пустая строка отключает исходящий вызов: агент сам забирает очередь.

`rights` со значением `log` отвечает 400. Удаление пользователя `DELETE /api/main/user/{id}`, у которого есть серверы, отвечает 409.

## Каталог и команды

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/samba/servers/{id}/directory` | Снимок: `synced_at` и дерево подразделений, пользователей, групп |
| POST | `/api/samba/servers/{id}/commands` | Поставить команду. Тело: `type`, `args`. Чтение — `directory` или `manage`, запись — `manage` или `shares` |
| GET | `/api/samba/servers/{id}/commands/{commandId}` | Статус и результат. Пока команда `queued`, `delivered` или `running`, она ещё выполняется |

Типы команд: `directory.read`, `ou.ensure`, `ou.delete`, `user.ensure`, `user.disable`, `user.enable`, `user.delete`, `user.set_password`, `group.ensure`, `group.delete`, `group.members`, `object.read`, `object.write`, `object.move`, `shares.read`, `shares.apply`, `share.remove`, `shares.homes`, `conf.read`, `conf.write`, `smb.template`.

`user.ensure`: `name`, `password` (8–128 символов), необязательные `given_name`, `surname`, `ou`. `group.members`: `name`, `member`, `action` (`add` или `remove`). `object.move`: `kind` (`user`, `group`, `ou`), `name`, `parent` — DN. `object.write` принимает атрибуты из белого списка: `givenName`, `sn`, `displayName`, `description`, `mail`, `telephoneNumber`, `title`, `department`, `company`, `physicalDeliveryOfficeName`, `homeDirectory`, `homeDrive`, `scriptPath`, `profilePath`. `conf.read` и `conf.write`: `file` равен `smb` или `shares`.

## Импорт

Нужно право `manage` и уже снятый каталог. Иначе импорт отвечает 400 «Сначала обновите каталог».

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/samba/servers/{id}/import-map` | Правила полей. Тело: `{ "user": { "givenName": "first_name" }, "group": { "description": "description" } }` |
| PUT | `/api/samba/servers/{id}/import-map` | Сохранить правила. Неизвестные атрибуты и пустые источники отбрасываются |
| POST | `/api/samba/servers/{id}/import` | Поставить команды импорта |

Тело импорта:

| Поле | Смысл |
|------|--------|
| `ou_ids` | Подразделения Main, которые создать в корне домена |
| `user_ids` | Пользователи |
| `group_ids` | Группы |
| `seen_ou_ids`, `seen_user_ids`, `seen_group_ids` | Что было показано в окне. По ним сохраняется отметка «В домене» |

Пользователь или группа, чьё подразделение не входит в `ou_ids`, пропускается. Ответ: `{ "queued": 0, "skipped": ["…"] }`.

Отметка «В домене» — поле `domain` у `PUT /api/main/user/{id}`, `PUT /api/main/group/{id}` и `PUT /api/main/ou/{id}`.

## Агент

Без JWT, кроме bundle: для архива нужны учётные данные владельца.

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/samba/agent/bundle` | Zip. Обязателен `server_id`. Логин и пароль в JSON или HTTP Basic. Внутри `install.sh`, `agent.ini` (токен и `listen`) и `ca.pem`. Нет сертификата — 503 |
| POST | `/api/samba/agent/enroll` | Регистрация по токену установки |
| POST | `/api/samba/agent/heartbeat` | Состояние, часы, по расписанию обновление каталога. `Authorization: Bearer` секрета агента |
| GET | `/api/samba/agent/poll` | Длинный опрос, до 40 секунд |
| POST | `/api/samba/agent/result` | Результат команды |

На самом DC агент принимает `POST /run` и WebSocket. Заголовок `Authorization: Bearer` — токен из `agent.ini`, тот же, что в карточке сервера. Пустой токен отклоняется.

Переменные: `SAMBA_AGENT_CA_FILE` — PEM сертификата; `SAMBA_AGENT_HUB` — адрес хаба, по умолчанию `http://127.0.0.1:8766`.

Nginx: [nginx.md](nginx.md).
