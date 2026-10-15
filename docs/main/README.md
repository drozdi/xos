# Администрирование

Пользователи, группы, подразделения, каталог прав и журнал.

Доступ: роль `ROLE_MAIN`. Claimant `main`.

## Приложения

| ID | Экран |
|----|--------|
| main-users / main-user | Список и карточка пользователя |
| main-groups / main-group | Группы |
| main-ous / main-ou | Подразделения |
| main-claimants / main-claimant | Права |
| main-audit | Журнал |

Карточка открывается из списка и не видна в «Пуске».

Код: `server/src/Main`, `client/src/apps/main-*`.

См. [TZ.md](TZ.md), [API.md](API.md).
