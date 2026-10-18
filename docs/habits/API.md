# API — привычки

Своих маршрутов нет.

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/user-data` | Снимок, в нём ключ `habits.streaks` |
| PUT | `/api/user-data` | Запись `{ code: "habits.streaks", value }` |
| DELETE | `/api/user-data/habits.streaks` | Сброс |

`GET /api/user-data/habits.streaks` отвечает `404`, пока ключ не создан. Клиент поэтому читает общий список.
