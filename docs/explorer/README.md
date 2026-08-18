# Explorer — файловый менеджер

Файловая система пользователя, диски, архивы и связанные просмотрщики/редакторы.

## Claimant

- **Код:** `explorer`
- **Права:** `can_read`, `can_write`, `can_delete`
- **Роль:** `ROLE_EXPLORER`

## Приложения

| ID | Название | Тип | Назначение |
|----|----------|-----|------------|
| explorer | Проводник | regular | Основной файловый менеджер |
| explorer-open-picker | Открыть файл | picker | Диалог выбора файла (другие apps) |
| explorer-save-picker | Сохранить файл | picker | Диалог сохранения |
| explorer-notepad | Блокнот | regular | Текстовый редактор `.txt` |
| explorer-markdown-viewer | Markdown | regular | Просмотр/редактирование `.md` |
| explorer-image-viewer | Изображения | regular | Галерея, масштабирование |
| explorer-archiver | Архиватор | regular | zip/rar pack/unpack |
| explorer-video-player | Видеоплеер | regular | Видео + плейлисты `.xos-playlist` |
| explorer-audio-player | Аудиоплеер | regular | Аудио + плейлисты |

Просмотрщики открываются из проводника по типу файла или через контекстное меню.

## Backend

```
server/src/Explorer/
├── Controller/
│   ├── ExplorerController.php       # list, read, write, mkdir, …
│   ├── ExplorerDiskController.php   # пользовательские диски
│   └── ExplorerArchiveController.php
└── setting.json
```

**API prefix:** `/api/explorer/`

## Frontend

```
client/src/apps/explorer*/
client/src/features/explorer/        # ExplorerWorkspace, picker store
client/src/features/media-player/    # плейлисты audio/video
```

## Интеграции

- **SchoolTask** — прикрепление файлов к урокам через picker
- **Device** — загрузка изображений/файлов к устройствам
- **PKB** — vault хранит markdown на диске explorer

## Пользовательские диски

`GET/POST/DELETE /api/explorer/disks` — виртуальные точки монтирования с произвольным root-path.

## Документы

| Файл | Содержание |
|------|------------|
| [TZ.md](TZ.md) | Техническое задание |
| [PLAN.md](PLAN.md) | План pickers / multi-instance |
| [TODO.md](TODO.md) | Трекинг |
