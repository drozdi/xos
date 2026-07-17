# Отчёт о соответствии проекта XOS техническому заданию

**Дата проверки:** 2026-07-17  
**Источник ТЗ:** `docs/TZ.md`  
**Дополнительно:** `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`

---

## Краткий вывод

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| **Ядро клиента** (WM, App Manager, Taskbar, Settings, Core API) | **Соответствует (~90%)** | Реализовано; есть мелкие расхождения с §7.2 |
| **Ядро сервера** (Auth, Account, Settings) | **Соответствует (~85%)** | URL отличаются от таблицы в ТЗ (`/api/*`) |
| **Модуль Main** (справочники) | **Соответствует (~85%)** | CRUD + scope на сервере и клиенте; File API — заглушка |
| **Модуль Device** | **Частично (~70%)** | CRUD на сервере есть; клиентского приложения нет; scope Device не enforced |
| **Модуль IBlock** | **Частично (~65%)** | CRUD на сервере есть; клиента нет; нет проверки scope |
| **Дополнительные клиентские приложения** | **Удовлетворяют цели ТЗ §6.2** | Регистрация через манифест, lazy-load, права; Device/IBlock UI не реализованы |
| **Критерии приёмки §9 (нефункциональные)** | **Частично** | Покрытие тестами <70%; bundle — цель зафиксирована, нужна верификация на CI |

**Общая оценка готовности по функциональным требованиям ТЗ: ~82%**  
**Готовность к приёмке по полному чек-листу §9: ~75%**

---

## 1. Серверная часть (TZ §4.1)

### 1.1 Модуль App (ядро)

| Требование | Статус | Реализация |
|------------|--------|------------|
| ApiLoginController | ✅ | `server/src/App/Controller/ApiLoginController.php` — login, login-check, user |
| ApiAccountController | ✅ | `server/src/App/Controller/ApiAccountController.php` — account, map, accesses, roles, options |
| ApiScopeController | ⚠️ | `server/src/App/Controller/ApiScopeController.php` — только map/accesses (дублирует account) |
| Settings API + user_settings | ✅ | `ApiSettingsController`, `UserSetting`, миграции |
| RefreshToken | ✅ | Gesdinet + `RefreshToken` entity |
| JWT + Password Hasher + CORS | ✅ | `security.yaml`, Lexik, Nelmio CORS |

**Расхождения с таблицей URL в ТЗ:**

- Префикс `/api/` (в ТЗ пути без префикса).
- Refresh: `POST /api/token/refresh` вместо `POST /refresh-token`.
- Settings: `GET/POST/DELETE /api/settings/{category}/{key}` вместо `GET /api/settings/:key`.

### 1.2 Модуль Device

| Требование | Статус | Реализация |
|------------|--------|------------|
| Сущности Device, License, Software, … | ✅ | `server/src/Device/Entity/` |
| CRUD API | ⚠️ | Контроллеры для Device, Type, Property, Software, License, SubDevice, Component; **Accounting** — только list/select; LicenseKey — без POST/DELETE |
| Проверка ролей/скоупов | ❌ | Атрибут `#[Access]` на контроллерах, **listener не найден** — проверки не выполняются |

### 1.3 Модуль IBlock

| Требование | Статус | Реализация |
|------------|--------|------------|
| Сущности Block, Element, Property, Section, Type | ✅ | `server/src/IBlock/Entity/` |
| CRUD API | ✅ | `IBlockCrudController` + контроллеры; тесты `IBlockApiTest.php` |
| Проверка ролей/скоупов | ❌ | Только `IS_AUTHENTICATED_FULLY` |

### 1.4 Модуль Main

| Сущность / API | Статус | Реализация |
|----------------|--------|------------|
| User | ✅ | `UserController` — list, filter, detail, CRUD, role-options; `UserScopeResolver` |
| Group | ✅ | `GroupController` — CRUD, filter; granular scopes (update/user/access) |
| OU | ✅ | `OUController` — CRUD + scope |
| Claimant | ✅ | `ClaimantController` — CRUD + scope |
| UserSelect (для UI) | ✅ | `UserSelectController` — без scope (по замыслу) |
| Role (entity) | ⚠️ | Entity + `ClaimantManager`; **нет REST CRUD** для `main_role` |
| File | ❌ | `FileController::upload()` — **пустая заглушка** |
| StoredAuth | ❌ | Entity есть; API нет |

---

## 2. Клиентская часть (TZ §4.2)

### 2.1 Window Manager

| Требование | Статус | Путь |
|------------|--------|------|
| open/close/minimize/maximize/restore/focus | ✅ | `core/windowManager/useWmStore.ts` |
| react-rnd, mobile <768px fullscreen | ✅ | `core/windowManager/Window.tsx` |
| WindowApi + createChildWindow | ✅ | `WindowApi.ts`, `ChildWindowPortal.tsx` |
| Сохранение WIN в settings | ✅ | `persistWindow.ts` |
| useWindowSize | ✅ | `useWindowSize.ts`, `data-window-width` |
| Error Boundary | ✅ | `WindowErrorBoundary.tsx` |
| Восстановление окон | ⚠️ | Через launch history + persist; `restoreWindows()` не вызывается отдельно |

### 2.2 App Manager

| Требование | Статус | Путь |
|------------|--------|------|
| AppManifest, singleInstance, instanceKey | ✅ | `core/appManager/types.ts`, `useAppManager.ts` |
| import.meta.glob | ✅ | `registerApps.ts` |
| История запусков | ✅ | `launchHistory.ts` (категория APP в SettingManager) |
| Фильтрация по ролям/скоупам | ✅ | `AppRegistry.ts`, `canAccess` / `requiredRole` |
| Класс App.ts (EventBus) | ❌ | Не реализован (§7.2) |

### 2.3 Taskbar + Layout + Desktop

| Требование | Статус | Примечание |
|------------|--------|------------|
| Start Menu с фильтрацией | ✅ | `StartMenu.tsx` |
| Группировка окон | ⚠️ | По `taskbarGroup` (обычно = `wmGroup`); `wmSort` из манифеста часто 0 |
| parseView, ResizablePanel, mobileView | ✅ | `core/layout/` |
| Боковые панели l/r в рабочем столе | ⚠️ | Desktop: `h m f` без боковых панелей; `panelView` в defaults не подключён |
| DesktopIcon | ❌ | Не реализован (§7.2) |

### 2.4 Settings + Core API + Auth

| Требование | Статус |
|------------|--------|
| SettingManager, LocalStorage/Api/Composite adapters | ✅ |
| useSetting, useSetState, preload | ✅ |
| createCoreApi (http, toast, auth, window, roles, scopes, settings) | ✅ |
| coreRoles, coreScopes, authStore, interceptors 401/403 | ✅ |
| Tailwind `window:` breakpoints | ⚠️ | Container queries в `window-breakpoints.css` |

---

## 3. Дополнительные модули (клиентские приложения)

ТЗ §6.2: *«Добавление новых приложений не требует изменений в ядре — достаточно создать модуль в src/apps/»*.

### 3.1 Модуль Main (бизнес-приложения) — **удовлетворяет ТЗ**

| App ID | Назначение | Права | Статус |
|--------|------------|-------|--------|
| `main-users` | Список пользователей | `requiredRole: main` + проверки в UI | ✅ |
| `main-user` | Карточка: Общие / Группы / Права / Роли | `can_read/create/update`, `can_group`, `can_access`, `can_role` | ✅ |
| `main-groups` | Список групп | `can_read.main.group` | ✅ |
| `main-group` | Карточка: Общие / Пользователи / Права | granular scopes | ✅ |
| `main-ous` | Список подразделений | `can_read.main.ou` | ✅ |
| `main-ou` | Карточка OU | CRUD scopes | ✅ |
| `main-claimants` | Список правил | `can_read.main.claimant` | ✅ |
| `main-claimant` | Карточка правила | CRUD scopes | ✅ |
| `settings` | Профиль пользователя | `requiredRole: user` | ✅ |

**Паттерн:** list-app → detail-app через `launchApp`, `MainEntityForm`, `mainAccess.ts`, серверные `UserScopeResolver` + `filter*Payload`. Соответствует архитектуре ТЗ и расширяемости §6.2.

**Замечания:**

- List-приложения Main опираются на `requiredRole: 'main'`, детальная проверка `can_read` — внутри app (как `MainUsersApp`).
- `main-users/index.ts` не задаёт `canAccess` — доступ только по роли `ROLE_MAIN*`.

### 3.2 Демо-приложения — **удовлетворяют §6.2 (примеры расширения)**

| App ID | Назначение | Статус |
|--------|------------|--------|
| `demo-calculator` | Демо WM, singleInstance, child windows | ✅ |
| `sudoku` | Игра, unit-тесты логики | ✅ |
| `tic-tac-toe` | Игра, unit-тесты логики | ✅ |

Не входят в обязательный функционал CRM из §4.1, но подтверждают модульность платформы.

### 3.3 Device / IBlock — **клиент не реализован**

| Модуль (сервер) | Клиентское app в `src/apps/` | Вывод |
|-----------------|------------------------------|-------|
| Device | ❌ нет | API готов частично; UI для ТЗ «CRM + устройства» **не закрыт** |
| IBlock | ❌ нет | API готов; UI инфоблоков **не закрыт** |

**Вывод по дополнительным модулям:**  
Реализованные Main-приложения и демо **полностью соответствуют** модели расширения из ТЗ. **Не удовлетворяют** полноте ТЗ модули **Device** и **IBlock** на клиенте и частично на сервере (scope, Accounting, File).

---

## 4. Интеграция клиент ↔ сервер (TZ §5)

| Требование | Статус |
|------------|--------|
| JWT login / refresh / logout | ✅ |
| Роли и scopes при auth | ✅ |
| ApiAdapter для settings | ✅ (`VITE_USE_API_SETTINGS`) |
| Interceptors 401/403/500 | ✅ |
| Zod-валидация ответов API | ✅ (`mainApi.ts`, `account.ts`, …) |
| Дублирование проверок прав на сервере | ✅ Main; ❌ Device/IBlock |

---

## 5. Критерии приёмки (TZ §9)

### 5.1 Функциональные

| Критерий | Статус |
|----------|--------|
| Аутентификация и данные пользователя | ✅ |
| Заявленные API работают | ⚠️ File upload Main — нет; Accounting — нет CRUD |
| Рабочий стол, окна, taskbar | ✅ |
| singleInstance | ✅ |
| Настройки local + API | ✅ |
| Права фильтруют приложения и UI | ✅ Main; ⚠️ list-apps по роли `main` |
| Адаптивный layout | ⚠️ Shell без боковых панелей |

### 5.2 Нефункциональные

| Критерий | Статус |
|----------|--------|
| Загрузка < 2 с | ⚠️ Не верифицировано в отчёте |
| Bundle < 200 KB gzip | ⚠️ Цель в `docs/PERFORMANCE.md`; CI-чек опционален |
| 60 FPS drag | ⚠️ Заявлено в PLAN; без автоматической метрики |
| Error Boundary | ✅ |
| Покрытие тестами ≥ 70% критических модулей | ❌ PHPUnit: 7 файлов; Vitest: ~31 файл; E2E: smoke + calculator |
| Документация для разработчиков | ✅ README, DEVELOPER_GUIDE, PLAN |

---

## 6. План реализации (docs/PLAN.md)

Все 12 этапов (0–12) отмечены **[x] выполненными**.  
Фактическое состояние кода **не полностью** совпадает с идеальным закрытием ТЗ (см. gaps ниже) — PLAN отражает roadmap, часть хвостов осталась.

---

## 7. Приоритетные несоответствия и рекомендации

### Критичные

1. **Device `#[Access]` не enforced** — реализовать listener или явные проверки в контроллерах.
2. **IBlock без scope checks** — добавить `UserScopeResolver` / политики по аналогии с Main.
3. **`FileController` (Main)** — реализовать upload или удалить маршрут.
4. **Клиент Device / IBlock** — при необходимости CRM по ТЗ: apps `device-*`, `iblock-*`.

### Средние

5. **Accounting CRUD** (Device) — дописать API или исключить из scope ТЗ.
6. **Role REST API** (`main_role`) — если нужно управление шаблонами ролей из UI.
7. **List-apps Main** — добавить `canAccess: canReadMain*` в манифесты.
8. **Desktop layout** — подключить `panelView` с ResizablePanel или обновить ТЗ/документацию.

### Низкие

9. Унификация URL с таблицей ТЗ (алиасы `/refresh-token`).
10. `App.ts`, `DesktopIcon.tsx`, `i18n/` — опционально по §7.2.
11. Вызов `restoreWindows()` или удаление мёртвого кода.
12. Передача `wmSort` из манифеста в `launchApp`.

---

## 8. Итоговая таблица модулей

| Модуль | Сервер | Клиент (apps) | Соответствие ТЗ |
|--------|--------|---------------|-----------------|
| App (ядро) | ✅ | ✅ (core) | ✅ |
| Main | ✅ (~85%) | ✅ | ✅ |
| Device | ⚠️ (~70%) | ❌ | ⚠️ частично |
| IBlock | ⚠️ (~65%) | ❌ | ⚠️ частично |
| Settings | ✅ | ✅ | ✅ |
| WM / App Manager / Taskbar | — | ✅ | ✅ |
| Demo (calculator, games) | — | ✅ | ✅ (§6.2) |

---

**Заключение:** Проект **соответствует ТЗ как платформа десктоп-CRM с модулем Main и полноценным клиентским ядром**. Дополнительные клиентские модули (Main-* и demo) **удовлетворяют** требованиям расширяемости §6.2. **Не удовлетворяют** полному объёму ТЗ: **Device** (без UI, слабая авторизация), **IBlock** (без UI, без scope), **File upload Main**, **критерий 70% test coverage**, часть пунктов §7.2 и shell layout.

*Отчёт сформирован автоматически по состоянию репозитория на дату проверки.*
