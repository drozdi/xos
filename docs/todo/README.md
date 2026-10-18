# Задачи

Списки дел и общий доступ к списку.

Окно открыто любому вошедшему: модуль не в списке защищённых. Права на списки — scope claimant `todo`. Код: `server/src/Todo`, `client/src/apps/todo`. В манифесте окно называется «Заметки». Привычки описаны в [habits/README.md](../habits/README.md).

Виджет «Сегодня» читает `GET /api/todo/items/due`.

См. [TZ.md](TZ.md), [API.md](API.md).
