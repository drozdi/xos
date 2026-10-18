# Администрирование

Пользователи, группы, подразделения, каталог прав и журнал действий.

Доступ: `ROLE_MAIN`. Claimant `main`. Код: `server/src/Main`, `client/src/apps/main-*`.

## Приложения

| ID | Экран |
|----|--------|
| main-users / main-user | Список и карточка пользователя: профиль, пароль, роли, группы |
| main-groups / main-group | Группы и состав |
| main-ous / main-ou | Дерево подразделений |
| main-claimants / main-claimant | Правила доступа, собранные из `setting.json` модулей |
| main-audit | Журнал |

Карточка открывается из списка и не видна отдельным пунктом «Пуска».

## Активное подразделение

Пользователь выбирает его в настройках. Ключ user-data: `main.active_ou_id`. Его читают списки, которые вызывают `OuScope::applyListFilter`. Список устройств этот фильтр не применяет — см. [device/README.md](../device/README.md).

Синхронизация каталога прав: `php bin/console main:claimant:sync`.

См. [TZ.md](TZ.md), [API.md](API.md).
