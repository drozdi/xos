# Samba

Управление контроллерами домена Samba AD из рабочего стола XOS: регистрация сервера, выдача прав, установка агента, команды домена (дерево OU/пользователи/группы) и шары.

Доступ: `ROLE_SAMBA`. Код: `server/src/Samba`, `client/src/apps/samba-servers`, агент — `server/agent`.

## Состав

| Часть | Где | Роль |
|-------|-----|------|
| Центр | XOS API + окно «Серверы Samba» | Карточки серверов, права, очередь команд, bundle установки |
| Агент | Хост Samba DC | Poll/heartbeat, `samba-tool` / `ldb*`, правка шар |
| CA | `SAMBA_AGENT_CA_FILE` | PEM в zip как `ca.pem`; без файла bundle отвечает 503 |

## Сценарий владельца

1. Создать сервер: имя, описание, роль `ad_dc`, признак шар, часовой пояс.
2. Вкладка «Установка»: curl с HTTP Basic (`curl -u`) скачивает zip (`install.sh`, `agent.ini`, `ca.pem`).
3. На DC: PHP CLI 8.1+ (curl, json, sodium, openssl), Samba AD, `samba-tool`, `ldbmodify`, `ldbsearch`, systemd.
4. `sudo sh install.sh` → сервис `xos-agent`, enroll по токену из ini.
5. Вкладки «Домен» и «Шары» (по правам) ставят команды в очередь; агент забирает их long-poll.

На Zentyal шары часто в `/home/samba/shares` (не `/srv/samba`). Задайте `share_roots` в `agent.ini`. Unit монтирует `/home/samba` через `BindPaths` — каталог должен существовать или строку уберите.

## Права

Выдача чужому пользователю с `ROLE_SAMBA`: `view`, `shares`, `directory`, `provision`, `manage`. Журнал и передача владения — только владелец. Право `log` в выдаче запрещено (400). Удаление пользователя с серверами — 409, пока владение не передано.

## Nginx

Если перед API стоит nginx: таймаут long-poll и запрет резать User-Agent `PHP/` — см. [nginx.md](nginx.md). Агент шлёт `User-Agent: xos-agent/1`.

См. [TZ.md](TZ.md), [API.md](API.md).
