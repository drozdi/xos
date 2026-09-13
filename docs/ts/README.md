# TeamStorm — связь и задачи

Клиент On‑Premise [TeamStorm](https://docs.teamstorm.io/) через REST (`PrivateToken`): настройка связи, список и правка задач.

## Claimant / роль

- **Код:** `ts`
- **Права:** `can_read`, `can_write`
- **Роль приложения:** `ROLE_TS` / `ROLE_TS_ROOT`
- **Protected module:** `ts`

## Приложение

| ID | Название |
|----|----------|
| `teamstorm` | TeamStorm — вкладки **Связь** и **Задачи** |

На **Задачах** по умолчанию фильтр **Мои** (assignee/responsibles). Переключатель **Все** снимает фильтр. В таблице колонка **Описание** — plain-текст без HTML; в drawer описание редактируется **WYSIWYG (TipTap)** и сохраняется как HTML.

Для фильтра «Мои» укажите **Логин TeamStorm** на вкладке Связь (иначе сопоставление по email/login пользователя XOS).

## Backend

```
server/src/Ts/
├── Entity/UserTsCredential.php   # base_url, private_token, ts_username
├── Service/TsApiClient.php
├── Service/TsConnectionService.php
├── Service/TsWorkitemService.php # mine=1 → фильтр + догрузка страниц
└── Controller/…
```

**API:**

| Method | Path | Notes |
|--------|------|--------|
| GET/PUT/DELETE | `/api/ts/credentials` | + `ts_username` |
| POST | `/api/ts/connection/test` | ping |
| GET | `/api/ts/workspaces` | пространства |
| GET | `/api/ts/workspaces/{ws}/workitems` | `?mine=1&maxItemsCount=&fromToken=` |
| GET/PATCH | `/api/ts/workspaces/{ws}/workitems/{id}` | правка name/description/status |

## Env

```env
TS_TOKEN_SECRET=change-me-long-random-string
```

## Frontend

`client/src/apps/teamstorm/` · `client/src/features/teamstorm/`
