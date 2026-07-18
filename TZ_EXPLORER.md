# ТЗ: файловый менеджер XOS Explorer

> Версия: 2026-07-18  
> Основа: `xgn.explorer`, `xos.explorer`, архитектура XOS (`docs/ARCHITECTURE.md`)  
> Статус: концепция / идея ТЗ

---

## 1. Цель

Встроить в XOS полноценный **файловый менеджер** (аналог Проводника), объединив наработки legacy-проектов с текущим стеком:

- **Backend:** Symfony 7.3, JWT, модуль `Explorer` (или `Main` + расширение)
- **Frontend:** React 19, Mantine 9, окно в WindowManager (`client/src/apps/explorer-*`)

Пользователь работает с виртуальными дисками, деревом каталогов, списком файлов, контекстным меню и стандартными операциями (копирование, перемещение, корзина, загрузка, архивы).

---

## 2. Анализ исходников

### 2.1 `xgn.explorer` (эталон функционала)

**Назначение:** автономный веб-файловый менеджер gDTExplorer / xEXPLORER.

| Слой | Технологии |
|------|------------|
| Backend | PHP, `xEXPLORER\Main` → `Manager` → `LocalDisk`, Symfony MountManager |
| Frontend | RequireJS/AMD, jQuery, jQuery contextMenu, частично Vue |
| API | `POST apps/manager/ajax.php` + заголовки `X-Component-Name`, `X-Component-Action` |

**Ключевые возможности (реализованы):**

- Мульти-диски: `IMG://path`, `CSS://path` (виртуальные префиксы)
- Дерево каталогов + панель файлов (explorer)
- Загрузка с разрешением конфликтов (replace / cancel / both)
- Копирование, вырезание, вставка, переименование
- Корзина `.trash`: удаление, восстановление, очистка
- Создание папок
- ZIP pack/unpack (`gARCHIVE`)
- История навигации
- Открытие / предпросмотр по типу (image, audio, video, folder)
- Контекстное меню, расширяемое компонентами
- i18n (`i18n/ru.json`)

**Компонентная модель:**

```
config.json → components: [history, open, load, trash, upload, move, new, module, archive]
  → component/{name}/config.json (permission: read|write, interface hooks)
  → component/{name}/{action}.php + app.js + interface/*.js
```

**Legacy query API** (старый стек, `old/php/query.class.php`):

```
load [INFO|FILES|FOLDERS|TRASH|ALL|LIST] <path>
rename <from> to <to> | copy/move ... | delete [SHIFT] <path>
recycle/cleane/create FOLDER/upload ...
```

**Ограничения:**

- Auth фактически отключён (`config/auth.php` → `true`)
- Проверка прав в основном на клиенте
- Только локальные диски
- Три параллельных frontend-стека (old/core, control/, apps/manager/)
- Archive не всегда в активном `config.json`

---

### 2.2 `xos.explorer` (миграция на Symfony-кernel)

**Назначение:** рефакторинг xgn под custom OS-kernel с Symfony-компонентами.

| Слой | Технологии |
|------|------------|
| Backend | Custom `OS` kernel, DI (XML), Symfony Routing/Security/HttpKernel |
| Frontend | Частичный Vue-rewrite, RequireJS, desktop shell в `apps/core` |
| API | Symfony routes (`/manager/load/*`) + задуманный component-dispatch |

**Что перенесено:**

- Те же классы `xEXPLORER\Main`, `Manager`, `LocalDisk`
- Та же модель компонентов (`components/` вместо `component/`)
- Symfony Security (in-memory user, form login)
- Desktop: login, taskbar, window-manager

**Что не завершено:**

- Нет `ajax.php`-диспетчера для component actions (есть только `/manager/load/*`)
- `load.json` ссылается на `interface/explorer.js`, `tree.js` — файлы не перенесены из xgn
- Archive / module — заглушки
- **Нет интеграции** с основным XOS (React client + Symfony server в `server/`)

**Вывод:** xgn — источник **функционала и UX**, xos.explorer — **направление миграции backend** (DI, routing, security), но оба проекта — legacy относительно текущего XOS.

---

### 2.3 Текущий XOS (контекст интеграции)

- `Main\FileManager` — загрузка файлов в `var/uploads/{module}/`, привязка к сущности `File`; не файловый менеджер
- Известные риски: path traversal, публичная раздача uploads (см. `docs/PROJECT_AUDIT_FULL_2026-07-17.md`)
- Паттерн модулей: `server/src/{Module}/` + `client/src/apps/{app-id}/` + JWT scopes

---

## 3. Концепция решения в XOS

### 3.1 Продуктовая модель

Одно или несколько окон-приложений:

| App ID | Назначение |
|--------|------------|
| `explorer` | Основной файловый менеджер (дерево + список + toolbar) |
| `explorer-preview` | Опционально: просмотр файла в дочернем окне |

Группа меню: **Система** или **Средства**. Single instance или multi — на выбор (рекомендация: single для explorer, multi для preview).

### 3.2 Виртуальные диски

Сохранить модель из xEXPLORER:

```text
{DiskName}://{relative/path}
```

Пример конфигурации (аналог `config/.core.php`):

```php
[
    'user' => '{login}',
    'access' => 'read write',
    'disks' => [
        'UPLOADS' => ['root' => '%upload_dir%', 'access' => 'read write'],
        'PUBLIC'  => ['root' => '%public_dir%',  'access' => 'read'],
    ],
]
```

Диски задаются администратором; пользователю доступны только разрешённые mount points (связь с `UserScopeResolver` / claimant `explorer.disk`).

### 3.3 Backend-модуль `Explorer`

```
server/src/Explorer/
├── Entity/          # опционально: ExplorerMount, ExplorerFavorite (фаза 2)
├── Controller/
│   ├── ExplorerBrowseController.php   # list folder, tree, info
│   ├── ExplorerOperationController.php # copy, move, rename, delete
│   ├── ExplorerTrashController.php
│   ├── ExplorerUploadController.php
│   └── ExplorerArchiveController.php
├── Service/
│   ├── ExplorerManager.php            # порт xEXPLORER\Manager
│   ├── LocalVolume.php
│   ├── TrashService.php
│   └── ArchiveService.php             # ZIP
├── Security/
│   └── ExplorerPathValidator.php      # anti path traversal
├── config/routes.yaml
└── setting.json                       # claimant + map-access
```

**API prefix:** `/api/explorer/*` (REST + JSON, без legacy query language и без header-dispatch).

Примерные endpoints:

| Метод | Путь | Действие |
|-------|------|----------|
| GET | `/api/explorer/config` | диски, права, настройки UI |
| GET | `/api/explorer/tree?disk=UPLOADS&path=/` | дерево (lazy) |
| GET | `/api/explorer/list?disk=&path=&type=files\|folders\|all` | содержимое папки |
| GET | `/api/explorer/info?path=` | свойства объекта |
| POST | `/api/explorer/folder` | создать папку |
| POST | `/api/explorer/upload` | multipart upload |
| POST | `/api/explorer/copy` | `{ from, to, conflictPolicy }` |
| POST | `/api/explorer/move` | idem |
| PATCH | `/api/explorer/rename` | `{ path, newName }` |
| DELETE | `/api/explorer/item` | soft → trash |
| POST | `/api/explorer/trash/restore` | recycle |
| DELETE | `/api/explorer/trash` | cleane (empty trash) |
| POST | `/api/explorer/archive/pack` | ZIP |
| POST | `/api/explorer/archive/unpack` | ZIP |

**Ответ list/info** — унифицированный DTO:

```json
{
  "path": "UPLOADS://docs",
  "type": "folder",
  "name": "docs",
  "size": 0,
  "modifiedAt": "2026-07-18T12:00:00+03:00",
  "access": "read write",
  "mime": null,
  "children": []
}
```

---

## 4. Frontend (React)

### 4.1 Структура

```
client/src/apps/explorer/
├── index.ts                 # AppManifest
├── ExplorerApp.tsx          # layout: Tree + FileList + StatusBar
├── ExplorerIcon.tsx
client/src/features/explorer/
├── explorerApi.ts           # Zod + TanStack Query
├── explorerAccess.ts
├── components/
│   ├── ExplorerTree.tsx
│   ├── ExplorerGrid.tsx     # list / icons view (фаза 2)
│   ├── ExplorerToolbar.tsx
│   ├── ExplorerBreadcrumb.tsx
│   ├── UploadDropzone.tsx
│   └── ConflictDialog.tsx
├── hooks/
│   ├── useExplorerSelection.ts
│   ├── useExplorerClipboard.ts  # copy/cut/paste state
│   └── useExplorerHistory.ts
└── contextMenu/
    └── explorerMenuItems.ts
```

### 4.2 UI-поведение (из xgn)

- **Layout:** sidebar (дерево) + main (список) + footer (статус, «Назад»)
- **Selection:** single / multi (Ctrl, Shift)
- **Dblclick:** папка → вход; файл → open/preview
- **Контекстное меню:** зависит от selection + прав (read/write)
- **Drag & drop:** загрузка в текущую папку (фаза 2 — move между папками)
- **Конфликты:** modal replace / skip / rename / apply to all
- **Скрытые:** `.trash`, `.tmp` не показывать в обычном режиме; отдельный вид «Корзина»

### 4.3 Компонентная модель (упрощённая)

Legacy `components/*.json` заменить на **feature flags / scopes**:

| Scope | Функция |
|-------|---------|
| `explorer.read` | просмотр, скачивание |
| `explorer.write` | upload, rename, move, copy, new folder |
| `explorer.trash` | delete, restore, empty trash |
| `explorer.archive` | pack/unpack ZIP |

Контекстное меню собирается декларативно в `explorerMenuItems.ts` по scopes.

---

## 5. Безопасность (обязательно)

Учесть уроки аудита XOS и слабости legacy explorer:

1. **Path traversal:** нормализация пути, запрет `..`, проверка что итог внутри `disk.root`
2. **Server-side ACL:** каждый endpoint проверяет scope + disk access; не полагаться на UI
3. **JWT:** тот же firewall `/api/*`, без отдельной session-auth explorer
4. **Upload:** лимит размера, whitelist MIME/extension, virus scan — опционально (фаза 3)
5. **Download/serve:** только через `/api/explorer/download` с проверкой прав, не прямой доступ к FS
6. **Audit log:** кто удалил/переместил файл (фаза 2)
7. **Symlink / special files:** явная политика (игнор или read-only)

---

## 6. Связь с существующим FileManager

| Сценарий | Решение |
|----------|---------|
| Файлы SchoolTask, Device и др. | Диск `UPLOADS` или отдельный `APP_FILES` → `var/uploads` |
| Метаданные в БД (`main_file`) | Explorer работает с FS; связь entity↔path — через API модулей (не дублировать) |
| Публичные uploads | Убрать anonymous `/uploads/`; раздача только через Explorer download + token |

---

## 7. Миграция legacy → XOS

### Фаза 0 — Инвентаризация (1–2 дня)

- [ ] Зафиксировать переносимый PHP: `xEXPLORER/Manager`, `LocalDisk`, `Util`, `gARCHIVE`
- [ ] Отбросить: query language, ajax.php header routing, RequireJS, jQuery contextMenu
- [ ] Сверить component actions xgn ↔ список REST endpoints

### Фаза 1 — MVP (5–7 дней)

- [ ] Backend: config, list, tree, info, mkdir, upload, rename, copy, move, soft delete
- [ ] Frontend: окно explorer, дерево, список, breadcrumb, базовое контекстное меню
- [ ] Scopes + PHPUnit API tests
- [ ] Один диск `UPLOADS`

### Фаза 2 — Паритет с xgn (4–5 дней)

- [ ] Корзина: restore, empty trash
- [ ] Clipboard UX (copy/cut/paste)
- [ ] Conflict resolution UI
- [ ] History back/forward
- [ ] Multi-disk config
- [ ] ZIP pack/unpack

### Фаза 3 — Расширения (опционально)

- [ ] Preview (image, text, pdf)
- [ ] Grid view, сортировка, фильтры
- [ ] Favorites, recent paths
- [ ] FTP/S3 volumes (новый `VolumeInterface`)
- [ ] E2E Playwright: upload → move → trash → restore

---

## 8. Нефункциональные требования

| Требование | Значение |
|------------|----------|
| Размер папки list | pagination или virtual scroll (react-window) |
| Upload | chunked upload для >50 MB (фаза 3) |
| Локализация | ru (default), ключи i18n в `features/explorer/locales/` |
| Совместимость | Chrome/Edge последние 2 версии |
| Производительность | tree lazy-load; list до 1000 элементов без блокировки UI |

---

## 9. Критерии приёмки MVP

1. Пользователь с `explorer.read` открывает приложение из меню Пуск, видит дерево и файлы диска `UPLOADS`.
2. Пользователь с `explorer.write` создаёт папку, загружает файл, переименовывает, копирует и перемещает.
3. Удаление отправляет объект в `.trash`; без `explorer.trash` — операция запрещена (403).
4. Попытка `../../etc/passwd` через API → 400/403.
5. Все операции работают через JWT; без токена — 401.
6. PHPUnit: минимум 15 тестов на browse + operations + ACL.

---

## 10. Риски

| Риск | Митигация |
|------|-----------|
| Дублирование с `Main\FileManager` | Чёткое разделение: entity attachments vs user-facing FS |
| Незавершённый xos.explorer вводит в заблуждение | Использовать xgn как functional spec, xos.explorer — только для идей DI/routing |
| Большой объём legacy JS | Не портировать; переписать UI на React |
| Безопасность FS | PathValidator + server ACL с первого дня |

---

## 11. Решения, требующие согласования

1. **Один модуль `Explorer` vs расширение `Main`** — рекомендация: отдельный модуль по аналогии с Device/IncCom.
2. **Single vs multi instance** окна explorer.
3. **Список дисков по умолчанию** для production (только uploads или также user home?).
4. **Интеграция с SchoolTask files** — открывать папку вложений из карточки задания (deep link `instanceKey` + path).
5. **Судьба каталогов `xgn.explorer/` и `xos.explorer/`** — archive / reference после MVP или постепенный demontage.

---

## 12. Ссылки на исходники

| Ресурс | Путь |
|--------|------|
| xgn.explorer (рабочий UI) | `xgn.explorer/apps/manager/` |
| xgn backend | `xgn.explorer/php/xEXPLORER/` |
| xgn component API | `xgn.explorer/apps/manager/ajax.php` |
| xos.explorer kernel | `xos.explorer/core/` |
| xos.explorer manager | `xos.explorer/apps/manager/` |
| XOS FileManager (attachments) | `server/src/Main/Service/FileManager.php` |
| XOS architecture | `docs/ARCHITECTURE.md` |

---

*Документ описывает целевую интеграцию файлового менеджера в XOS на основе анализа двух legacy-проектов. Детализация API (OpenAPI), макеты UI и оценки по задачам — следующий шаг после согласования раздела 11.*
