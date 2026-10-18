# API — оболочка

Своего префикса нет. Оболочка пользуется общим API из [../API.md](../API.md).

| Метод | Путь | Кто вызывает |
|-------|------|----------------|
| POST | `/api/login` | Экран входа |
| POST | `/api/token/refresh` | Обновление access |
| POST | `/api/logout` | Выход |
| GET | `/api/account` | Вкладка профиля |
| PUT, PATCH | `/api/account` | Сохранение профиля и пароля |
| GET | `/api/account/accesses` | Какие приложения показать |
| GET | `/api/account/map` | Карта прав |
| GET | `/api/desktop-state` | Старт стола |
| PUT | `/api/desktop-state` | Сохранение окон, темы, виджетов, истории |
| GET | `/api/user-data` | Снимок prefs, в том числе активное подразделение и стикеры |
| PUT | `/api/user-data` | Запись ключа `{ code, value }` |
| DELETE | `/api/user-data/{code}` | Удаление ключа |
| GET | `/api/settings` | Отдельные ключи, если экран их читает |
| POST | `/api/settings` | Запись ключа |
| DELETE | `/api/settings/{category}/{key}` | Удаление ключа |
| GET | `/api/browser/proxy` | Окно `browser` |

Категории снимка: `USER`, `APP` (`launchHistory`), `WIN` (`{appId}/{windowId}`).

Поиск Ctrl+K не имеет метода. Он вызывает списки задач, доски, PKB и проводника, описанные в их API.
