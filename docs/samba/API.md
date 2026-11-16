# API Samba

Нужна роль `ROLE_SAMBA`. Чужой сервер без права просмотра отвечает 404.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/samba/servers` | Свои серверы и серверы с выданным доступом |
| POST | `/api/samba/servers` | Создать. Тело: `name`, `description`, `role` (`ad_dc`), `file`, `expected_timezone` |
| GET | `/api/samba/servers/{id}` | Карточка. Список выдач только у владельца |
| PUT | `/api/samba/servers/{id}` | Изменить. Только владелец |
| DELETE | `/api/samba/servers/{id}` | Удалить запись. Только владелец. Ответ 204 |
| POST | `/api/samba/servers/{id}/access` | Выдать доступ: `user_id`, `rights` (`view`, `shares`, `directory`, `provision`, `manage`) |
| DELETE | `/api/samba/servers/{id}/access/{userId}` | Отозвать |
| POST | `/api/samba/servers/{id}/transfer` | Передать владение: `user_id` |
| GET | `/api/samba/servers/{id}/log` | Журнал. 403 всем, кроме владельца |
| POST | `/api/samba/servers/{id}/enrollment` | Одноразовый секрет установки на 30 минут. Только владелец |
| POST | `/api/samba/servers/{id}/commands` | Поставить команду домена. Тело: `type`, `args`. Чтение дерева — `directory` или `manage`, запись — `manage`. Пароль в ответе не возвращается |
| GET | `/api/samba/servers/{id}/commands/{commandId}` | Статус и результат своей команды. Владелец видит любую |
| POST | `/api/samba/agent/bundle` | Архив агента без JWT. Обязателен `server_id`. Учётные данные: поля JSON `login` и `password` **или** HTTP Basic (как в команде установки с `curl -u`). Внутри `install.sh`, заполненный `agent.ini` и полный `ca.pem`. Нужна роль Samba и владение сервером. Нет сертификата — 503 |
| POST | `/api/samba/agent/enroll` | Регистрация агента по секрету. Без JWT |
| POST | `/api/samba/agent/heartbeat` | Состояние и часы. Заголовок `Authorization: Bearer` |
| GET | `/api/samba/agent/poll` | Длинный опрос команд, до 25 секунд |
| POST | `/api/samba/agent/result` | Результат команды |

`rights` со значением `log` отвечает 400. Удаление пользователя `DELETE /api/main/user/{id}`, у которого есть серверы, отвечает 409 «Сначала передайте серверы».
