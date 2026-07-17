# Полный аудит проекта XOS

**Дата:** 2026-07-17  
**Область:** весь репозиторий (`client`, `server`, `docs`, конфиги, тесты, git hygiene)

## Итог

Проект функционально развит, но имеет системные риски: нет CI, есть критичные security-ошибки на backend/frontend, не проходит frontend build/lint, и документация заметно отстаёт от фактической реализации.

---

## Critical

### 1) SQL-инъекция в базовом репозитории
- **Файл:** `server/src/AbstractRepository.php`
- **Проблема:** фильтры и сортировка собираются строковой интерполяцией (`IN ('...')`, `= '...'`) без параметров.
- **Риск:** инъекция через API payload, почти все репозитории наследуют этот класс.
- **Предложение:** перейти на bind parameters (`:param`) и whitelist полей сортировки.

### 2) Небезопасная раздача/загрузка файлов
- **Файлы:** `server/src/Main/Service/FileManager.php`, `server/src/Main/Controller/FileServeController.php`, `server/config/packages/security.yaml`
- **Проблема:** публичный `GET /uploads/*`; `module/subDir/fileName` формируют путь без нормализации и строгой валидации.
- **Риск:** утечка файлов заданий, path traversal.
- **Предложение:** закрыть `/uploads` для `PUBLIC_ACCESS`, выдавать через авторизованный endpoint/signed URL, нормализовать путь и запретить `..`.

### 3) Frontend production build не проходит
- **Команда:** `npm run build` (client)
- **Проблема:** TypeScript ошибки в `table` и test/storybook файлах, отсутствуют зависимости (`@testing-library/*`, `@storybook/react-vite`).
- **Риск:** невозможен стабильный production release.
- **Предложение:** исправить типы, исключить stories/tests из `tsc` или добавить зависимости и корректный test setup.

### 4) Token refresh queue зависает при ошибке refresh
- **Файл:** `client/src/core/api/interceptors.ts`
- **Проблема:** подписчики очереди 401 очищаются, но не `reject`-ятся.
- **Риск:** висящие промисы и застрявший UI.
- **Предложение:** хранить `{resolve,reject}` и на fail вызывать `reject` всем подписчикам.

### 5) XSS и небезопасный browser sandbox
- **Файлы:** `client/src/features/schooltask/EventDetailModal.tsx`, `client/src/apps/browser/BrowserApp.tsx`
- **Проблема:** `dangerouslySetInnerHTML`; `iframe srcDoc` с `allow-scripts + allow-same-origin`.
- **Риск:** выполнение произвольного JS, кража JWT из localStorage.
- **Предложение:** sanitization (DOMPurify/allowlist), ужесточить sandbox, убрать `allow-same-origin`.

### 6) CI/CD отсутствует
- **Факт:** нет `.github/workflows/*` и аналогов.
- **Риск:** регрессии попадают в main без автоматической проверки.
- **Предложение:** добавить CI: server PHPUnit + client lint/test/build + optional e2e.

---

## High

### 1) Большой WIP SchoolTask незакоммичен
- **Факт:** много `??` в `git status` для SchoolTask backend/frontend и тестов.
- **Риск:** потеря работы, отсутствие code review.
- **Предложение:** атомарные коммиты по подсистемам.

### 2) Миграции переписаны в рабочем дереве
- **Факт:** удалена старая миграция, добавлены новые.
- **Риск:** несогласованность БД между окружениями.
- **Предложение:** зафиксировать стратегию (squash/sync), не удалять уже применённые миграции без плана.

### 3) Доки отстают от реализации
- **Файлы:** `docs/API_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/TEST_REPORT.md`, `docs/DEVELOPER_GUIDE.md`
- **Проблема:** устаревшие endpoint/статус/тестовые цифры; SchoolTask не описан полно.
- **Предложение:** синхронизировать docs с текущим кодом.

### 4) IBlock и часть backend контроллеров без scope-защиты
- **Факт:** много `Route` и мало/нет `Access` в IBlock.
- **Риск:** избыточный доступ при JWT.
- **Предложение:** унифицировать политику авторизации по модульному шаблону Main/Device.

### 5) Device select-методы обходят AccessSubscriber
- **Файлы:** `server/src/App/EventSubscriber/AccessSubscriber.php`, `server/src/Device/Controller/*Controller.php`
- **Проблема:** если у метода нет method-level `#[Access]`, subscriber не проверяет class-level защиту; это затрагивает часть `select` endpoint.
- **Риск:** чтение справочников Device без ожидаемых scope-check.
- **Предложение:** либо enforce class-level default policy в subscriber, либо поставить `#[Access('can_read')]` на все `select`.

### 6) User enumeration через `/api/main/user/select`
- **Файл:** `server/src/Main/Controller/UserSelectController.php`
- **Проблема:** endpoint доступен авторизованному пользователю без полноценной проверки scopes.
- **Риск:** массовое перечисление пользователей (login/alias/email).
- **Предложение:** ограничить `canReadMainUser`/ролью или OU-границами.

### 7) Утечка полей восстановления в user detail
- **Файл:** `server/src/Main/Controller/UserController.php`
- **Проблема:** в detail отдаются `stored_hash` и `checkword`.
- **Риск:** лишняя экспозиция чувствительных данных.
- **Предложение:** удалить эти поля из API-ответа; при необходимости отдельный admin-only endpoint.

### 8) SchoolTask: access/pagination/UX несогласованы
- **Файлы:** `client/src/apps/schooltask-*`, `client/src/features/schooltask/*`, `server/src/SchoolTask/*`
- **Проблема:** frontend и backend по правам/пагинации местами расходятся; редактор расписания не запущен из списка.
- **Предложение:** выровнять контракт и добавить e2e сценарий SchoolTask.

---

## Medium

- `npm run lint` падает (64 errors) — требуется cleanup legacy table/chess/core кода.
- `client/test-results/*` и root `package-lock.json` отслеживаются git (шум в репозитории).
- JWT хранится в `localStorage` (`client/src/core/auth/tokenStorage.ts`) — высокий риск при XSS.
- Нет server static analysis (`phpstan/php-cs-fixer`).
- Нет coverage-gates в CI.
- Часть API возвращает разный формат селектов (`label` vs `text`) без явной спецификации.

---

## Что в порядке

- Frontend unit tests: **167/167 passed** (`npm run test`).
- PHP синтаксис по `server/src|migrations|tests`: ошибок не найдено.
- `npm audit --omit=dev`: vulnerabilities не обнаружены.
- Архитектурно сильная база: window manager, app registry, settings adapters, Zod-схемы API.

---

## Приоритетный план исправлений

1. Закрыть security: `AbstractRepository`, upload/serve файлов, XSS/sandbox, refresh queue.  
2. Починить `npm run build` и `npm run lint` до зелёного состояния.  
3. Включить CI (lint/test/build/phpunit).  
4. Зафиксировать миграции и закоммитить SchoolTask WIP атомарно.  
5. Синхронизировать документацию с кодом.

---

## Выполненные проверки

- `client`: `npm run test` ✅, `npm run build` ❌, `npm run lint` ❌, `npm audit --omit=dev` ✅  
- `server`: PHP lint (`php -l` рекурсивно) ✅  
- git hygiene: `git status --short`, `git ls-files`, `.gitignore` проверены.

