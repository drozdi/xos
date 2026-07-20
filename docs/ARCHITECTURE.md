# Архитектура xos

## Обзор

Монорепозиторий: Symfony 7 (API) + React 19 (desktop-shell клиент).

| Слой | Путь | Назначение |
|------|------|------------|
| App | `server/src/App/` | Kernel, JWT, общие subscribers, HTTP-утилиты |
| Main | `server/src/Main/` | Пользователи, OU, файлы, настройки |
| Device | `server/src/Device/` | Учёт оборудования |
| IBlock | `server/src/IBlock/` | Инфоблоки |
| IncCom | `server/src/IncCom/` | Учёт доходов/расходов |
| SchoolTask | `server/src/SchoolTask/` | Школьное расписание |
| Explorer | `server/src/Explorer/` | Файловый менеджер |

Клиент: `client/src/apps/*` — окна рабочего стола; `client/src/core/*` — auth, API, theme.

## Безопасность API

- JWT (`/api/login`, refresh, logout).
- Scope ACL: атрибут `#[Access('module.code')]` на контроллере + `#[Access('can_read|can_create|...')]` на методах.
- `AccessSubscriber` проверяет права до вызова action.
- Загрузки: `UploadPathResolver` (whitelist модулей, защита от path traversal).
- `/uploads` — только для аутентифицированных пользователей.

## Пагинация

Legacy-формат: `limit` / `offset` в теле POST + заголовок `Content-Range: items start-end/total`.

Утилита: `App\Http\ContentRangeHeaders::forLegacyPagination()`.

IncCom дополнительно поддерживает `page` / `size` через `LegacyPaginationAdapter`.

## Ошибки API

- 400 validation: `{ "message": "...", "violations": { "field": "..." } }` (`ApiExceptionSubscriber`).
- Legacy IBlock: плоский объект `{ "field": "message" }` — клиент поддерживает оба формата (`apiError.ts`).

## Клиент

- Один `QueryClient` в `client/src/core/api/queryClient.ts` (IncCom использует родительский provider из `App.tsx`).
- CRUD-хелперы: `client/src/core/api/crudHelpers.ts`.

## Тесты

- PHPUnit: `server/tests/`, база `sqlite` в `.env.test`.
- Vitest: `client/src/**/*.test.ts(x)`.
- CI: `.github/workflows/ci.yml`.
