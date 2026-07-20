# Предложения по улучшению XOS

**Дата:** 2026-07-20  
**Основа:** обзор репозитория `client/`, `server/`, `docs/`, миграций и тестов.  
**Связанные документы:** [PROJECT_AUDIT_FULL_2026-07-17.md](PROJECT_AUDIT_FULL_2026-07-17.md), [PROJECT_REVIEW_2026-07-17.md](PROJECT_REVIEW_2026-07-17.md)

## Краткий итог

Проект — зрелый CRM/desktop-shell (Symfony 7 + React 19, ~51 мини-приложение). Архитектура рабочая, но накопился **технический долг в трёх слоях**: безопасность (файлы, фильтры, ACL), согласованность модулей (3 стиля API/auth/pagination) и инфраструктура (нет CI, build client падает, тесты не покрывают Device/IncCom).

Недавняя работа с Device выявила отдельный класс проблем: **рассинхрон entity ↔ БД** (varchar id, отсутствие PK, осиротевшие FK) — это нужно закрепить процессом, а не разовыми правками.

---

## Critical — безопасность и целостность данных

| # | Проблема | Где | Предложение |
|---|----------|-----|-------------|
| 1 | SQL-инъекция в фильтрах/сортировке | `server/src/AbstractRepository.php:14-34` | Параметризованный DQL (`setParameter`), whitelist полей сортировки в каждом репозитории |
| 2 | Публичная раздача `/uploads/*` | `server/config/packages/security.yaml`, `Main/Controller/FileServeController.php` | Авторизованный endpoint или signed URL; убрать `PUBLIC_ACCESS` |
| 3 | Path traversal при upload/serve | `FileManager.php`, `FileServeController.php`, `FileController.php` | Whitelist модулей, `realpath()` + проверка префикса `upload_dir`, запрет `..` |
| 4 | IBlock без scope/ACL | `server/src/IBlock/Controller/*` | `#[Access('iblock.*')]` или Voters по аналогии с IncCom |
| 5 | Device `select` без проверки scope | `AccessSubscriber.php`, `Device/Controller/*` | Class-level default policy или `#[Access('can_read')]` на все `select` |
| 6 | Upload устройства при `can_read` | `Device/Controller/DeviceController.php` (~204) | Требовать `can_update` для upload |
| 7 | XSS в SchoolTask | `EventDetailModal.tsx`, `EventManager.php` | Plain text или серверный allowlist-sanitizer (см. аудит 17.07) |
| 8 | Миграция с DELETE осиротевших строк | `migrations/Version20260720072214.php` | Перед prod: бэкап + отчёт по количеству удаляемых строк; разбить на инкрементальные миграции |

---

## High — архитектура и согласованность

### Backend

| # | Проблема | Где | Предложение |
|---|----------|-----|-------------|
| 9 | Три модели авторизации | Main (scope вручную), Device (`#[Access]`), IncCom (Voters) | Единый шаблон: Voters + `#[IsGranted]` или расширить `AccessSubscriber` |
| 10 | Три формата пагинации | Content-Range / page+size / LegacyAdapter | Общий `PaginationService` + единый JSON-контракт |
| 11 | Разные форматы ошибок 400 | `AbstractManager`, `IBlockCrudController`, `DtoValidator` | `ApiExceptionListener` + единая схема `{errors: {field: message}}` |
| 12 | Валидация в lifecycle через `\Exception` | `Device/Entity/*.php` (15+ файлов) | Symfony Validator + `ValidationFailedException` → 400, не 500 |
| 13 | Service locator в менеджерах | `AbstractManager.php`, `*Manager.php` | Constructor injection |
| 14 | God-классы | `DeviceManager.php` (~857 строк), `Device.php` (~900), `TransactionsController.php` (~760) | Разбить по use-case / aggregate |
| 15 | `Routing\Annotation\Route` vs `Attribute\Route` | ~26 vs ~18 контроллеров | Миграция на `Attribute\Route` |
| 16 | Невалидный ORM mapping | `Device/History.php:30` — `inversedBy: 'devices'` (поля нет) | Исправить связь; прогонять `doctrine:schema:validate` в CI |
| 17 | `$id` без типа в entity | Device-модуль (частично исправлено) | Везде `private ?int $id = null` + `declare(strict_types=1)` в новых файлах |
| 18 | PHPUnit через SchemaTool, не миграции | `tests/AuthWebTestCase.php` | Integration-тест `doctrine:migrations:migrate` на fixture-БД |

### Frontend

| # | Проблема | Где | Предложение |
|---|----------|-----|-------------|
| 19 | **Production build падает** | `components/table/utils/create-template-context.tsx` | Исправить TS-ошибки; `npm run build` в CI |
| 20 | Дублирование table | `components/table/` ↔ `features/inccom/shared/ui/table/` | Один shared-компонент |
| 21 | Дублирование API helpers | `mainApi.ts`, `deviceApi.ts` | `core/api/crudHelpers.ts` |
| 22 | Два QueryClient | `App.tsx`, `inccom/shared/api/query-client.ts` | Один клиент из App |
| 23 | `extractApiFieldErrors` не понимает IncCom | `core/api/apiError.ts` | Поддержка `violations` nested |
| 24 | Refresh queue при ошибке refresh | `core/api/interceptors.ts` | `reject` всем подписчикам очереди |
| 25 | Chess на JS без типов | `client/src/apps/chess/**/*.js` | Постепенная миграция на TS или `// @ts-check` |

### DevOps

| # | Проблема | Где | Предложение |
|---|----------|-----|-------------|
| 26 | Сломанный Dockerfile | `Dockerfile` — `node index.js` в PHP-проекте | Multi-stage: `npm build` + `php-fpm`/Symfony CLI |
| 27 | Нет CI/CD | нет `.github/workflows/` | Pipeline: phpunit, vitest, `npm run build`, `doctrine:schema:validate` |
| 28 | Нет статического анализа | — | PHPStan (level 6+), ESLint strict в CI |

---

## Medium — качество и поддержка

| # | Область | Предложение |
|---|---------|-------------|
| 29 | Тесты | Покрыть Device API (`tests/Controller/DeviceApiTest.php`) и IncCom; e2e для device-списков |
| 30 | Документация | Обновить `ARCHITECTURE.md` (статус «pre-implementation» устарел), `API_SPEC.md`, `TEST_REPORT.md` |
| 31 | IBlock | Нет клиентского модуля — пометить server-only или добавить apps |
| 32 | IncCom legacy | Удалить `sign-up-page.tsx`, заглушки auth в `entities/user/api/auth.ts` |
| 33 | Маршруты IncCom | `/api/accounts` без префикса модуля — унифицировать с `/api/{module}/...` |
| 34 | Performance | `limit: -1` по умолчанию в list (`IBlockCrudController`, `DeviceController`) — разумный default (50–100) |
| 35 | N+1 | `UserController` filter по OU; `DeviceController` detail — eager fetch / DTO projection |
| 36 | Enum в MySQL | `doctrine.yaml` mapping `enum→string` — задокументировать; миграция enum→VARCHAR для `d_license` |
| 37 | `server/var/cache` в git status | Убедиться в `.gitignore`; не коммитить cache |
| 38 | Deprecated API | `DeviceLegacyRedirectController` — план удаления после миграции клиентов |

---

## Low — косметика и долгосрочное

- Удалить мёртвый `JsonAuthenticator.php` (не в firewall)
- Удалить debug `/api/protected` в `ApiLoginController`
- Обновить `components/table/README.md` (устаревшие пути `@/shared/ui/table`)
- IncCom widgets: `features/inccom/widgets/index.ts` — TODO phase 6
- PostgreSQL `identity_generation_preferences` в `doctrine.yaml` при MySQL — убрать шум
- PSR-4 `""` → `src/` в `composer.json` — рассмотреть `App\` namespace

---

## База данных — рекомендации после инцидента с миграциями

1. **Не генерировать blind `migrations:diff`** на «грязной» БД — сначала `doctrine:schema:validate`.
2. **Типы id:** все Device-entity с `?int $id`; не допускать varchar PK/FK.
3. **PRIMARY KEY:** многие `d_*` таблицы исторически без PK — проверить `information_schema` перед добавлением FK.
4. **Осиротевшие FK:** перед миграцией — SQL-отчёт по orphan count; DELETE только с логированием.
5. **Процесс:**
   ```bash
   php bin/console doctrine:schema:validate
   php bin/console doctrine:migrations:diff   # только после validate OK
   php bin/console doctrine:migrations:migrate --dry-run
   ```
6. **Тест:** добавить `MigrationTest` — migrate up на пустой MySQL fixture.

---

## Быстрые победы (1–2 дня) — выполнено 2026-07-20

1. ~~Исправить `History.php` mapping (`inversedBy`)~~ — убран неверный `inversedBy: 'devices'` у `parent`
2. ~~Исправить TS в `create-template-context.tsx` → зелёный `npm run build`~~ — также `grouped.tsx`
3. ~~Добавить `#[Access]` на IBlock list/create/update/delete~~ — 5 контроллеров + `IBlock/setting.json`
4. ~~Закрыть `/uploads` в `security.yaml`~~ — JWT firewall + `IS_AUTHENTICATED_FULLY`
5. ~~Вынести `crudHelpers.ts` для main/device API~~ — `client/src/core/api/crudHelpers.ts`
6. ~~GitHub Actions: phpunit + vitest + build~~ — `.github/workflows/ci.yml`

---

## Приоритетный план (по неделям)

| Неделя | Фокус |
|--------|-------|
| 1 | Security hotfix: AbstractRepository, uploads, IBlock ACL, build client |
| 2 | CI + `doctrine:schema:validate` + тесты Device API |
| 3 | Унификация pagination/errors; рефакторинг table/queryClient |
| 4 | DeviceManager split; документация; миграционный процесс |

---

## Метрики для контроля

| Метрика | Сейчас | Цель |
|---------|--------|------|
| PHPUnit test files | 8 | 12+ (Device, IncCom) |
| Vitest tests | 32+ | без регрессии |
| `npm run build` | FAIL | PASS |
| CI pipeline | нет | есть |
| `doctrine:schema:validate` | FAIL (mapping) | PASS |
| Модулей без ACL | IBlock | 0 |

---

*Документ сформирован автоматически по состоянию кода на 2026-07-20. Детали по SchoolTask и ранним находкам — в аудите от 2026-07-17.*
