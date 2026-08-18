# ТЗ — Explorer (файловый менеджер)

> Версия: 1.1 · Дата: 2026-08-18 · Статус: **реализовано** (pickers — см. PLAN)

## 1. Назначение

Виртуальная файловая система пользователя, просмотрщики и редакторы файлов, интеграция с другими приложениями через picker.

## 2. Пользователи и доступ

- **Claimant:** `explorer`
- **Права:** `can_read`, `can_write`, `can_delete`
- **Роль:** `ROLE_EXPLORER`

## 3. Приложения (9)

| ID | Тип | Назначение |
|----|-----|------------|
| explorer | regular | Файловый менеджер |
| explorer-open-picker | picker | Диалог «Открыть» |
| explorer-save-picker | picker | Диалог «Сохранить как» |
| explorer-notepad | regular | `.txt` редактор |
| explorer-markdown-viewer | regular | Markdown live/source/reading |
| explorer-image-viewer | regular | Изображения, zoom |
| explorer-archiver | regular | zip pack/unpack |
| explorer-video-player | regular | Видео + плейлисты |
| explorer-audio-player | regular | Аудио + плейлисты |

## 4. Функциональные требования

### Проводник
- Навигация по VFS (`home://`, диски)
- CRUD: list, read, write, mkdir, rename, delete
- Контекстное меню, ассоциации типов файлов
- Multi-instance, per-window folder (`documentPath`)

### Pickers
- Отдельные окна, `skipHistory`
- Закрытие после выбора/отмены
- Window-scoped consumer для Open

### Satellite apps
- Открытие по типу файла / двойной клик
- Persist последнего файла per window
- Media: singleInstance; notepad/md: multi uuid

### Плейлисты
- Формат `.xos-playlist`
- Меню: Открыть / Сохранить / Сохранить как

## 5. API

**Prefix:** `/api/explorer/`

| Endpoint | Описание |
|----------|----------|
| `GET/POST …/list` | Листинг |
| read/write/rename/delete | Файловые операции |
| `/disks` | Пользовательские диски |
| `/archive/pack`, `/unpack` | Архиватор |

## 6. Backend

```
server/src/Explorer/
├── Controller/
└── setting.json
```

## 7. Критерии приёмки

- [x] CRUD файлов с ACL
- [x] Pickers не в launch history
- [x] 2+ независимых explorer/notepad окон
- [x] Audio/video — один экземпляр, reload файла
- [ ] Manual: dirty-close notepad/md (см. PLAN DoD)

## 8. Связанные документы

- [README.md](README.md)
- [PLAN.md](PLAN.md) · [TODO.md](TODO.md)
- [TZ.md](../TZ.md)
