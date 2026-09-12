# IncCom — доходы и расходы

Учёт финансовых операций, категорий и отчётности.

## Claimant

- **Код:** `inccom`
- **Права:** `can_read`, `can_write`
- **Роль:** `ROLE_INCCOM`

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| inccom | Доходы и расходы | Единственное окно модуля |

## Backend

```
server/src/IncCom/
├── Controller/
│   ├── ItemController.php
│   ├── ItemCategoriesController.php
│   └── …
└── setting.json
```

**API prefix:** `/api/IncCom/`

Поддерживает legacy-пагинацию (`limit`/`offset`) и `page`/`size`.

## Frontend

```
client/src/apps/inccom/
client/src/features/inccom/
```

## Особенности

- Категории операций (доход/расход)
- Фильтрация и таблицы через `@/components/table`
- Отдельный QueryClient не используется — общий из `App.tsx`
- Чеки ФНС: `receipt_json` на транзакции, позиции → `TransactionItem` (`fill_items` / `receipt/apply-items`)

## Env: FNS token encryption

| Variable | Required | Description |
|----------|----------|-------------|
| `INCCOM_FNS_SECRET` | рекомендуется (prod) | Секрет для AES-256-GCM шифрования `UserFnsCredential.master_token` at rest |

- Без секрета токен пишется plaintext (dev/legacy).
- С секретом: на PUT — ciphertext с префиксом `enc:v1:`; decrypt только в `FnsReceiptService`.
- Legacy plaintext при чтении принимается; следующий PUT перешифровывает.

Пример в `server/.env`:

```env
INCCOM_FNS_SECRET=change-me-long-random-string
```

## API

Детали эндпоинтов — [API_SPEC.md](../API_SPEC.md), секция IncCom.

## Документы

- [TZ.md](TZ.md) — техническое задание
