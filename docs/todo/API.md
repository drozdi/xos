# API — задачи

Префикс `/api/todo`. Достаточно входа. Операции над списком проверяют scope `todo`.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/todo/lists` | Списки с пунктами |
| POST | `/api/todo/lists` | Создать список |
| GET | `/api/todo/lists/{id}` | Карточка |
| PUT | `/api/todo/lists/{id}` | Изменить список и пункты |
| DELETE | `/api/todo/lists/{id}` | Удалить |
| POST | `/api/todo/lists/{id}/share` | Открыть пользователю |
| DELETE | `/api/todo/lists/{id}/share/{userId}` | Закрыть доступ |
| GET | `/api/todo/users/by-email` | Найти пользователя |
| GET | `/api/todo/items/due` | Пункты со сроком |
