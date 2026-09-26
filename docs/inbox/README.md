# Inbox — внутренние сообщения

User→User почта внутри XOS (не IMAP).

## Claimant

- **Код:** `inbox`
- **Роль:** `ROLE_INBOX`

## Приложения

| ID | Название | Тип | Описание |
|----|----------|-----|----------|
| inbox | Inbox | regular | Список входящих/исходящих |
| inbox-message | Сообщение | sub-app | Карточка письма |

## Backend

```
server/src/Inbox/
├── Controller/MessageController.php
├── Entity/Message.php
├── Service/InboxManager.php
└── setting.json
```

**API prefix:** `/api/inbox/`

## Frontend

```
client/src/apps/inbox/
client/src/apps/inbox-message/
client/src/features/inbox/
```

## Документы

- [APP_IDEAS.md](../APP_IDEAS.md) — IMAP/SMTP (бэклог)
- [APPS.md](../APPS.md)
