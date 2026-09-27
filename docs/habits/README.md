# Habits — трекер привычек

Обёртка над Todo: ежедневные/повторяющиеся привычки без отдельной сущности `habit_log` (v1).

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| habits | Привычки | UI поверх Todo API |

## Frontend

```
client/src/apps/habits/
client/src/features/habits/habitUtils.ts
```

Доступ: как Todo — любой авторизованный (`canUseTodo()`), без `ROLE_TODO`.

## Документы

- [todo/README.md](../todo/README.md)
- [APPS.md](../APPS.md)
