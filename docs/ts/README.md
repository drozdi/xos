# TeamStorm

Просмотр пространств и задач внешнего TeamStorm. XOS хранит только учётные данные и проксирует API.

Доступ: `ROLE_TS`, claimant `ts`. Окно `teamstorm`. Виджет `widget-external` показывает те же задачи. Код: `server/src/Ts`, `client/src/apps/teamstorm`.

## Сценарий

Пользователь сохраняет URL и PrivateToken, проверяет соединение. Дальше читает пространства, список work item и карточку. Правка уходит `PATCH` в TeamStorm. Создать или удалить задачу из XOS нельзя. Токен шифруется (`TS_TOKEN_SECRET`) и в ответах не отдаётся.

См. [TZ.md](TZ.md), [API.md](API.md).
