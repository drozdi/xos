# API — Ops

Префикс `/api/ops`. `{kind}` ∈ `db|docker|vnc|tunnel`. Нужна соответствующая роль модуля.

## Ссылки

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ops/{kind}` | Список своих ссылок |
| POST | `/api/ops/{kind}` | Создать |
| PUT | `/api/ops/{kind}/{id}` | Изменить |
| DELETE | `/api/ops/{kind}/{id}` | Удалить |

## Docker

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/ops/docker/{id}/containers` | Контейнеры |
| POST | `/api/ops/docker/{id}/containers/{containerId}/start` | Старт |
| POST | `/api/ops/docker/{id}/containers/{containerId}/stop` | Стоп |
| GET | `/api/ops/docker/{id}/containers/{containerId}/logs` | Логи |

`containerId` — `[a-fA-F0-9]{12,64}`.

## VNC

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/ops/vnc/{id}/frame` | Кадр / действие ввода |

## SQL

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/ops/db/{id}/query` | Выполнить запрос (тело со statement) |

## Туннель

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/ops/tunnel/{id}/start` | Поднять |
| POST | `/api/ops/tunnel/{id}/stop` | Остановить |
