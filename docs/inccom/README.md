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

## API

Детали эндпоинтов — [API_SPEC.md](../API_SPEC.md), секция IncCom.
