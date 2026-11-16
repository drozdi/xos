# API RDP

Доступ к методам ниже, кроме `redeem` и `release`, требует `ROLE_RDP`. Админка сетей требует `ROLE_RDP_ROOT` или `ROLE_ROOT`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/rdp/connections` | Список своих подключений |
| POST | `/api/rdp/connections` | Создать |
| PUT | `/api/rdp/connections/{id}` | Изменить |
| DELETE | `/api/rdp/connections/{id}` | Удалить |
| POST | `/api/rdp/connections/check-host` | `{host}` → зона, имя своей сети, `allowed`, `reason` |
| POST | `/api/rdp/gateway/ticket` | `{connection_id}` → `{ticket, gateway_url}` |
| POST | `/api/rdp/gateway/redeem` | Заголовок `X-Gateway-Secret`, тело `{ticket}` |
| POST | `/api/rdp/gateway/release` | `{user_id, connection_id}` и тот же заголовок |
| GET | `/api/rdp/networks` | Сети, доступные пользователю |
| GET/POST | `/api/rdp/admin/networks` | Все сети / создать |
| PUT/DELETE | `/api/rdp/admin/networks/{id}` | Изменить / удалить |
| GET/PUT | `/api/rdp/admin/networks/{id}/grants` | Выдачи. PUT принимает `{grants:[{group_id}|{role}]}` |

`redeem` возвращает проверенный `resolved_ip`, параметры RDP и узел `{host, port, tls, ca_fingerprint}`. Пароль есть только в этом ответе.
