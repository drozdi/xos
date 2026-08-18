# ТЗ — SchoolTask (школьное расписание)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **реализовано** (есть backlog — REVIEW)

## 1. Назначение

Управление предметами, классами, расписанием занятий, домашними заданиями и журналом учителя.

## 2. Пользователи и доступ

- **Claimant:** `schooltask` → `subject`, `class`, `event`, `zam`
- **Роль:** `ROLE_SCHOOLTASK`
- Роли в классе: тьютор, учитель урока, ученик (membership)

## 3. Приложения (8)

| ID | Тип | Назначение |
|----|-----|------------|
| schooltask-subjects | regular | Предметы |
| schooltask-subject | sub-app | Карточка предмета, учителя |
| schooltask-classes | regular | Классы |
| schooltask-class | sub-app | Карточка класса |
| schooltask-calendars | regular | Список расписаний |
| schooltask-calendar | sub-app | Календарь класса (просмотр) |
| schooltask-calendar-editor | sub-app | Редактор шаблона недели |
| schooltask-calendar-teacher | regular | «Мои уроки» учителя |

## 4. Функциональные требования

### Предметы и классы
- CRUD предметов, привязка учителей
- CRUD классов, подгруппы, параллели
- Membership учеников

### Расписание
- Сетка недели (`@mantine/schedule`)
- События: start/end, цвет, группа, повторения
- Редактор для тьютора / scope-пользователя

### Урок учителя
- Тема, ДЗ, материалы
- Файлы урока (Explorer picker)
- Multipart save

### Интеграции
- Overlay «Моё расписание» в приложении **Calendar**

## 5. API

**Prefix:** `/api/schooltask/`

| Ресурс | Путь |
|--------|------|
| Предметы | `/subjects` |
| Классы | `/classes` |
| События | `/events`, `/calendar/*` |
| Auth | `/auth/me` |

## 6. Backend

```
server/src/SchoolTask/
├── Controller/
├── Service/EventManager.php
└── setting.json
```

## 7. Известные пробелы

См. [REVIEW.md](REVIEW.md): права тьютор/scope, публичные uploads, IDOR, серии событий.

## 8. Критерии приёмки (целевые)

- [x] CRUD предметов, классов, событий
- [x] Teacher calendar + modal редактирования
- [x] Файлы урока через Explorer
- [ ] Исправления из REVIEW (backlog)

## 9. Связанные документы

- [README.md](README.md)
- [REVIEW.md](REVIEW.md)
- [calendar/TZ.md](../calendar/TZ.md) — overlay
