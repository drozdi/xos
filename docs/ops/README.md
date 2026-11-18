# Ops (Docker, VNC, SQL, туннель)

Сохранённые «ссылки» на внешние системы и рабочие экраны: Docker API, кадр VNC, SQL-запрос, SSH-туннель. Общий шаблон UI — список слева и рабочая область.

Доступ: роли модуля Ops / связанные claimants (см. `setting` и ProtectedAppModules). Код: `server/src/Ops`, клиент `client/src/apps/docker|vnc|db|tunnel`, общий экран `client/src/features/ops`.

## Виды (`kind`)

| kind | Окно | API |
|------|------|-----|
| `docker` | docker | CRUD `/api/ops/docker` + containers/start/stop/logs |
| `vnc` | vnc («Стол») | CRUD + `POST .../frame` (кадр PNG, не видеопоток) |
| `db` | db | CRUD + `POST .../query` |
| `tunnel` | tunnel | CRUD + start/stop туннеля |

Список и правка подключений: `GET|POST /api/ops/{kind}`, `PUT|DELETE /api/ops/{kind}/{id}`.

## Ограничения

`PublicHost` режет приватные и служебные адреса (SSRF), кроме явно разрешённых сценариев. Секреты хранятся на сервере. VNC — опрос кадров, не замена RDP/Guacamole.

Рядом по смыслу: [SSH](../ssh/README.md), [RDP](../rdp/README.md).

См. [TZ.md](TZ.md), [API.md](API.md).
