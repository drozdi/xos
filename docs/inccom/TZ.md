# ТЗ — IncCom (доходы и расходы)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Учёт финансовых операций организации: доходы, расходы, категории, отчёты.

## 2. Пользователи и доступ

- **Claimant:** `inccom`
- **Права:** `can_read`, `can_write`
- **Роль:** `ROLE_INCCOM`

## 3. Приложения

| ID | Название | Описание |
|----|----------|----------|
| inccom | Доходы и расходы | Единое окно модуля |

## 4. Функциональные требования

- CRUD операций (items)
- Категории доходов/расходов
- Фильтрация, сортировка, таблицы
- Пагинация: legacy (`limit`/`offset`) и `page`/`size`

## 5. API

**Prefix:** `/api/IncCom/`

| Ресурс | Пример |
|--------|--------|
| Items | `/items` |
| Categories | `/item-categories` |

## 6. Backend / Frontend

```
server/src/IncCom/
client/src/apps/inccom/
client/src/features/inccom/
```

## 7. Критерии приёмки

- [x] CRUD операций и категорий
- [x] Scope read/write enforced
- [x] Таблицы с server pagination

## 8. Связанные документы

- [README.md](README.md)
- [API_SPEC.md](../API_SPEC.md) § IncCom
