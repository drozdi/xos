# Main — администрирование

Управление пользователями, группами, подразделениями (OU) и правилами доступа (claimants).

## Claimant

- **Код:** `main`
- **Права:** `main.user`, `main.group`, `main.ou`, `main.claimant`
- **Роль:** `ROLE_MAIN` / `ROLE_MAIN_ROOT`

## Приложения

| ID | Название | Тип | Описание |
|----|----------|-----|----------|
| main-users | Пользователи | regular | Список пользователей, создание |
| main-user | Пользователь | sub-app | Карточка: профиль, роли, группы, пароль |
| main-groups | Группы | regular | Список групп |
| main-group | Группа | sub-app | Карточка группы, участники, права |
| main-ous | Подразделения | regular | Организационная структура |
| main-ou | Подразделение | sub-app | Карточка OU |
| main-claimants | Доступные права | regular | Каталог claimants и scope |
| main-claimant | Доступное право | sub-app | Редактирование правила доступа |

Sub-app открываются из списков; `startMenu: false`, `instanceKey` = ID сущности.

## Backend

```
server/src/Main/
├── Controller/     # User, Group, Ou, Claimant, Role, File, …
├── Entity/
├── Service/
└── setting.json
```

**API prefix:** `/api/main/`

Основные сущности: пользователи, группы, OU, роли, claimants, файлы, настройки модулей.

## Frontend

```
client/src/apps/main-*/
client/src/features/main/   # если есть общие компоненты
```

Утилиты sub-app: `client/src/apps/shared/mainAppUtils.ts` — общий шаблон манифеста.

## Права (scope)

Детальная матрица в `server/src/Main/setting.json`:

| Сущность | can_create | can_read | can_update | can_delete | прочее |
|----------|------------|----------|------------|------------|--------|
| user | ✓ | ✓ | ✓ | ✓ | can_access, can_group, can_role |
| group | ✓ | ✓ | ✓ | ✓ | can_access, can_user |
| ou | ✓ | ✓ | ✓ | ✓ | — |
| claimant | ✓ | ✓ | ✓ | ✓ | — |

Синхронизация claimants: `php bin/console main:claimant:sync` (см. [ARCHITECTURE.md](../ARCHITECTURE.md)).
