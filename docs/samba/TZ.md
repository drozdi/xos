# ТЗ — Samba

## 1. Назначение

Централизованно учитывать Samba AD DC и управлять ими через агент на хосте: каталог домена и файловые шары. XOS не ставит Samba и не держит пароли AD в открытом виде в ответах UI.

## 2. Модель

| Сущность | Смысл |
|----------|--------|
| `samba_server` | Карточка DC: владелец, роль `ad_dc`, `file` (есть шары), timezone, статус, generation |
| `samba_server_access` | Выдача прав другому пользователю |
| `samba_enrollment` | Одноразовый секрет установки (~30 мин) |
| `samba_agent_credential` | Секрет агента после enroll |
| `samba_command` | Очередь: type, args, статус, результат |

Роль NT4 в API не принимается (зарезервировано).

## 3. Агент

- Bundle: `POST /api/samba/agent/bundle` — JSON `server_id` + login/password **или** HTTP Basic; zip без JWT firewall.
- Enroll: `POST /api/samba/agent/enroll` по токену.
- Транспорт: heartbeat, long-poll (`GET .../poll`), `POST .../result` с Bearer секрета агента.
- CLI PHP 8.1+, расширения curl/json/sodium/openssl; systemd unit `xos-agent`.
- Домен: `samba-tool`, `ldbsearch`, `ldbmodify`, `sam.ldb`.
- Шары: `smb.conf`, `testparm`, корни из `share_roots`.

CA: env `SAMBA_AGENT_CA_FILE` (resolve `%kernel.project_dir%`). Dev PEM: `server/config/samba/agent-ca.pem`. Приватный ключ CA не коммитится.

## 4. Команды (типы)

Чтение дерева — право `directory` или `manage`. Запись объектов и шар — `manage` / `shares` по типу. Пароли из ответов команд в API не светятся.

Примеры: `directory.read`, `user.*` / `group.*` / `ou.*`, `shares.read` / запись шар, служебные provision — по `allow_provision` в ini.

## 5. UI

Окно `samba-servers`: список серверов, карточка с вкладками Сервер / Установка / Домен / Шары. Состояние вкладок и окна не должно сбрасываться при смене mobile/desktop layout. Карточка объекта домена — отдельный instance с props (`kind`, `name`, `serverId`).

## 6. Критерии

- [x] CRUD сервера, access, transfer, log владельца
- [x] Bundle + Basic Auth, enroll, heartbeat/poll/result
- [x] Очередь команд домена и шар
- [x] Dev CA и документация nginx
- [ ] Автообновление CA/ротация секрета агента без переустановки (идея)
