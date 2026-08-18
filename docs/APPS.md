# Каталог приложений XOS

> Обновлено: 2026-08-18 · 55 зарегистрированных приложений в `client/src/apps/*/index.ts`

## Как устроены приложения

| Слой | Путь | Назначение |
|------|------|------------|
| Манифест | `client/src/apps/<id>/index.ts` | Регистрация в shell (авто через `import.meta.glob`) |
| UI | `client/src/apps/<id>/*.tsx` | Корневой компонент окна |
| Фичи | `client/src/features/<domain>/` | Переиспользуемая логика домена |
| API | `client/src/core/api/endpoints/*Api.ts` | Клиент REST |
| Backend | `server/src/<Module>/` | Symfony-модуль, entities, controllers |

**Типы приложений:**

| Тип | Описание | Пример |
|-----|----------|--------|
| regular | Пункт меню «Пуск», основное окно | `todo`, `device-devices` |
| sub-app | Карточка сущности, `startMenu: false` | `device-device`, `main-user` |
| picker | Диалог выбора файла | `explorer-open-picker` |
| utility | Системное / демо, часто скрыто из списка | `settings`, `demo-calculator` |

**Доступ:** `requiredRole` (модуль), `canAccess()` (кастомная проверка) или без ограничений (игры). Защищённые модули — `ProtectedAppModules` в `server/src/App/Security/ProtectedAppModules.php`.

---

## Документация по доменам

| Домен | Claimant | Приложений | Обзор | ТЗ |
|-------|----------|------------|-------|-----|
| Система | — | 6 | [system/README.md](system/README.md) | [system/TZ.md](system/TZ.md) |
| Main | `main` | 8 | [main/README.md](main/README.md) | [main/TZ.md](main/TZ.md) |
| Device | `device` | 17 | [device/README.md](device/README.md) | [device/TZ.md](device/TZ.md) |
| Explorer | `explorer` | 9 | [explorer/README.md](explorer/README.md) | [explorer/TZ.md](explorer/TZ.md) |
| SchoolTask | `schooltask` | 8 | [schooltask/README.md](schooltask/README.md) | [schooltask/TZ.md](schooltask/TZ.md) |
| IncCom | `inccom` | 1 | [inccom/README.md](inccom/README.md) | [inccom/TZ.md](inccom/TZ.md) |
| Calendar | `calendar` | 1 | [calendar/README.md](calendar/README.md) | [calendar/TZ.md](calendar/TZ.md) |
| Todo | `todo` | 1 | [todo/README.md](todo/README.md) | [todo/TZ.md](todo/TZ.md) |
| Board | `board` | 1 | [board/README.md](board/README.md) | [board/TZ.md](board/TZ.md) |
| PKB | `pkb` | 1 | [pkb/README.md](pkb/README.md) | [pkb/TZ.md](pkb/TZ.md) |

Полный индекс документации: [README.md](README.md)

---

## Полный реестр

### Система

| ID | Название | wmGroup | singleInstance | Доступ |
|----|----------|---------|----------------|--------|
| settings | Settings | system | ✓ | все авторизованные |
| browser | Браузер | browser | — | все |
| chess | Шахматы | games | ✓ | все |
| tic-tac-toe | Крестики-нолики | games | ✓ | все |
| sudoku | Судоку | games | ✓ | все |
| demo-calculator | Calculator | tools | ✓ | все (демо) |

### Main

| ID | Название | Тип | Доступ |
|----|----------|-----|--------|
| main-users | Пользователи | regular | `requiredRole: main` |
| main-user | Пользователь | sub-app | main |
| main-groups | Группы | regular | main |
| main-group | Группа | sub-app | main |
| main-ous | Подразделения | regular | main |
| main-ou | Подразделение | sub-app | main |
| main-claimants | Доступные права | regular | main |
| main-claimant | Доступное право | sub-app | main |

### Device

| ID | Название | Тип |
|----|----------|-----|
| device-devices | Устройства | regular |
| device-device | Устройство | sub-app |
| device-sub-devices | Комплектующие | regular |
| device-sub-device | Комплектующее | sub-app |
| device-types | Типы устройств | regular |
| device-type | Тип устройства | sub-app |
| device-properties | Свойства | regular |
| device-property | Свойство | sub-app |
| device-components | Типы комплектующих | regular |
| device-component | Тип комплектующих | sub-app |
| device-softwares | Программы | regular |
| device-software | Программа | sub-app |
| device-software-types | Типы программ | regular |
| device-software-type | Тип программы | sub-app |
| device-licenses | Лицензии | regular |
| device-license | Лицензия | sub-app |
| device-license-key | Ключ лицензии | sub-app |

### Explorer

| ID | Название | Тип |
|----|----------|-----|
| explorer | Проводник | regular |
| explorer-open-picker | Открыть файл | picker |
| explorer-save-picker | Сохранить файл | picker |
| explorer-notepad | Блокнот | regular |
| explorer-markdown-viewer | Markdown | regular |
| explorer-image-viewer | Изображения | regular |
| explorer-archiver | Архиватор | regular |
| explorer-video-player | Видеоплеер | regular |
| explorer-audio-player | Аудиоплеер | regular |

### SchoolTask

| ID | Название | Тип |
|----|----------|-----|
| schooltask-subjects | Предметы | regular |
| schooltask-subject | Предмет | sub-app |
| schooltask-classes | Классы | regular |
| schooltask-class | Класс | sub-app |
| schooltask-calendars | Расписание | regular |
| schooltask-calendar | Календарь класса | sub-app |
| schooltask-calendar-editor | Редактор расписания | sub-app |
| schooltask-calendar-teacher | Мои уроки | regular |

### Бизнес-приложения (tools)

| ID | Название | API prefix | Особенности |
|----|----------|------------|-------------|
| inccom | Доходы и расходы | `/api/IncCom/` | учёт операций |
| calendar | Календарь | `/api/calendar/` | overlay: Todo, Board, SchoolTask |
| todo | Заметки | `/api/todo/` | списки, sharing, due dates |
| board | Доска | `/api/board/` | Kanban, workspaces |
| pkb | База знаний | `/api/pkb/` | vaults, wikilinks, graph |

---

## Backend-модули

| Модуль | Путь | Claimant | setting.json |
|--------|------|----------|--------------|
| App | `server/src/App/` | — | — |
| Main | `server/src/Main/` | main | ✓ |
| Device | `server/src/Device/` | device | ✓ |
| Explorer | `server/src/Explorer/` | explorer | ✓ |
| IBlock | `server/src/IBlock/` | — | ✓ |
| IncCom | `server/src/IncCom/` | inccom | ✓ |
| SchoolTask | `server/src/SchoolTask/` | schooltask | ✓ |
| Calendar | `server/src/Calendar/` | calendar | ✓ |
| Todo | `server/src/Todo/` | todo | ✓ |
| Board | `server/src/Board/` | board | ✓ |
| Pkb | `server/src/Pkb/` | pkb | ✓ |

IBlock — API инфоблоков, отдельного desktop-приложения нет.

---

## Связанные документы

| Документ | Содержание |
|----------|------------|
| [README.md](README.md) | Индекс всей документации |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Как добавить новое приложение |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектура monorepo |
| [API_SPEC.md](API_SPEC.md) | REST API (общий) |
| [TZ.md](TZ.md) | Общее ТЗ системы |
