# Nginx перед API агента Samba

Агент ходит на `POST /api/samba/agent/enroll`, `POST /api/samba/agent/heartbeat`, `GET /api/samba/agent/poll` и `POST /api/samba/agent/result`. Опрос держит соединение до 40 секунд. Тела — JSON.

Запрос с User-Agent по умолчанию у PHP (`PHP/8.x`) на проверенном стенде получал от nginx HTML `405 Not Allowed` и не доходил до Symfony. Тот же POST с `User-Agent: curl/…` или `User-Agent: xos-agent/1` доходил до приложения. Агент с версии, где в `server/agent/src/Http.php` задан `User-Agent: xos-agent/1`, от этого правила не зависит. Правило, которое режет `PHP/`, лучше убрать: оно ломает и другие клиенты на PHP.

## Таймауты

`proxy_read_timeout` должен быть больше длинного опроса. Иначе nginx оборвёт `GET /api/samba/agent/poll`, пока агент ждёт команду.

```nginx
location /api/samba/agent/ {
    proxy_pass http://xos_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 10s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    client_max_body_size 1m;
}
```

`/api/samba/agent/bundle` сюда не входит: архив скачивает администратор, не агент. Для него оставьте общий лимит тела API.

## WebSocket

Агент с `prefer = websocket` открывает `GET /api/samba/agent/ws`. Этот путь должен идти в процесс `php bin/console samba:agent-hub` (`SAMBA_AGENT_HUB`, по умолчанию `127.0.0.1:8766`), не в php-fpm. Таймаут чтения больше, чем у обычного API: соединение живёт, пока агент на связи.

```nginx
location /api/samba/agent/ws {
    proxy_pass http://127.0.0.1:8766;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

Блок ставят раньше общего `location /api/samba/agent/`.

## Что не ставить на эти пути

- `limit_except` и отдельные `if ($request_method …)`, которые оставляют GET и отрезают POST. Регистрация, heartbeat и результат — POST, опрос — GET.
- WAF-правила по подстроке `PHP/` в User-Agent.
- Кэш и `proxy_cache` на `/api/samba/agent/`: ответы зависят от секрета агента и очереди команд.
- Редирект POST на другой хост. После редиректа клиент может сменить метод, и enroll снова получит 405.

Проверка с хоста агента:

```bash
curl -sS -D - -o /dev/null -X POST https://xos.example/api/samba/agent/enroll \
  -H 'Content-Type: application/json' \
  -d '{"token":"bad","server_id":1}'
```

Ожидается JSON приложения (`403` с текстом про секрет), не HTML nginx `405`.
