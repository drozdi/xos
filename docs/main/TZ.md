# ТЗ — Main (администрирование)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано**

## 1. Назначение

Управление пользователями, группами, организационными единицами (OU) и правилами доступа (claimants) системы XOS.

## 2. Пользователи и доступ

- **Claimant:** `main` → `main.user`, `main.group`, `main.ou`, `main.claimant`
- **Роль:** `ROLE_MAIN`, `ROLE_MAIN_ROOT`
- Scope: CRUD + специальные (`can_access`, `can_group`, `can_role`, `can_user`)

## 3. Приложения

| ID | Тип | Функция |
|----|-----|---------|
| main-users | regular | Список пользователей |
| main-user | sub-app | Карточка пользователя |
| main-groups | regular | Список групп |
| main-group | sub-app | Карточка группы |
| main-ous | regular | Подразделения |
| main-ou | sub-app | Карточка OU |
| main-claimants | regular | Справочник прав |
| main-claimant | sub-app | Редактор claimant |

## 4. Функциональные требования

### Пользователи
- CRUD: login, email, alias, ФИО, пароль, описание
- Назначение ролей и групп
- Управление scope через группы

### Группы
- CRUD групп
- Участники, права (access bitmask)
- Привязка claimants

### OU
- Иерархия подразделений
- CRUD

### Claimants
- Синхронизация из `setting.json` модулей (`main:claimant:sync`)
- Редактирование `access_options` в Admin UI

## 5. API

**Prefix:** `/api/main/`

Основные ресурсы: users, groups, ou, claimants, roles, files.

Legacy-пагинация: POST `/list` + `Content-Range`.

## 6. Backend

```
server/src/Main/
├── Controller/
├── Entity/ (User, Group, Ou, Claimant, Role, File, …)
└── setting.json
```

## 7. Критерии приёмки

- [x] CRUD пользователей с проверкой scope
- [x] Группы и права влияют на доступ к приложениям
- [x] Claimant sync обновляет access_options
- [x] Sub-app открываются по ID из списков

## 8. Связанные документы

- [README.md](README.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md) — ADR claimants
- [TZ.md](../TZ.md) § Main
