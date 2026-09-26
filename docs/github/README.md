# GitHub — Issues proxy

Подключение Personal Access Token и просмотр/правка Issues через backend-proxy.

## Claimant

- **Код:** `github`
- **Роль:** `ROLE_GITHUB`

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| github | GitHub | Credentials + список/деталь Issues |

## Backend

```
server/src/Github/
├── Controller/   # credentials, connection, issues
├── Entity/UserGithubCredential.php
├── Service/      # token cipher, API client, issues
└── setting.json
```

**API prefix:** `/api/github/`

At rest: `GITHUB_TOKEN_SECRET` → AES (как Ts/IncCom).

## Frontend

```
client/src/apps/github/
client/src/features/github/
```

## Документы

- [APPS.md](../APPS.md)
- [APP_IDEAS.md](../APP_IDEAS.md)
