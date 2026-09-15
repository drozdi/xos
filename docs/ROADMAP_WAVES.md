# XOS expansion waves

Очередь продуктовых волн. Каждая волна — отдельный план/PR; не смешивать.

| Волна | Статус | Содержание |
|-------|--------|------------|
| **1** | **DONE** | IncCom: чек → `TransactionItem` (`fill_items` / `apply-items`); FNS `master_token` encrypt; Board↔PKB DX; seed Changelog |
| **2** | **DONE** | SchoolTask Critical B1–B3 / F1–F3; Explorer dirty-close (notepad/markdown + taskbar) |
| **3** | **partial** | Board polling + global search (DONE); Mercure/SSE + PKB encryption/plugins → **W3b** |
| **4** | backlog | Todo→Board; Device↔IncCom; due notify; новые apps по ТЗ |
| **5** | backlog | PWA/offline; mobile layout; audit UI; multi-OU |

## Волна 2 — детали

Источник: `docs/schooltask/REVIEW.md` (Critical), `docs/explorer/TODO.md`.

- **F1** — subject save: числовые `user_ids`
- **F2** — FormData без forced `Content-Type` (boundary от axios)
- **B1** — EventManager/controller: тьютор **или** scopes/ROOT; create/update/delete раздельно
- **B2** — `EpClassController` show/update: `checkScopes: false` + AccessSubscriber method opt-out
- **B3** — файлы заданий через `GET /api/schooltask/files/{id}/download`; `/uploads/task/` запрещён
- **F3** — запуск `schooltask-calendar-editor` из списков классов/календарей
- **Explorer** — dirty-close save/discard/cancel; taskbar через `getWindowApi().close()`

## Волна 3 — детали (pragmatic slice)

Источник: `docs/board/PLAN.md` B-050/B-051, `docs/board/TODO.md` фаза 5.

- **B-051 polling** — `GET /api/board/boards/{id}/changes?since=`; FE poll + React Query invalidate (без presence/conflict UI)
- **B-050 search** — `GET /api/board/search?q=`; shell search UI в Board app
- **W3b (later)** — Mercure/SSE; PKB encryption/plugins (templates/graph уже DONE в MVP)
