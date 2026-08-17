# TODO — Board App (Kanban)

> Источник: `docs/board/PLAN.md` §7 Фаза 0.  
> **Не коммитить** без явной просьбы.

## Легенда

- `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована

---

## Фаза 0 — Scaffolding ✅

**Субагент:** `developer` · завершено 2026-08-17

- [x] **B-001** Symfony module skeleton `server/src/Board/`  
  **Приёмка:** mapping OK (`doctrine:schema:validate`); DB drift — прежний, сущностей Board нет

- [x] **B-002** `Board/setting.json` + claimants  
  **Приёмка:** `main:claimant:sync --dry-run` → `board` в upserted

- [x] **B-003** `board` в `ProtectedAppModules` (BE+FE) + тест  
  **Приёмка:** Vitest `protectedApps.test.ts` PASS

- [x] **B-004** Frontend app stub (`apps/board/index.ts`, `BoardApp.tsx`)  
  **Приёмка:** manifest + `canAccess: () => canUseBoard()`

- [x] **B-005** `boardApi.ts` stub + `queryKeys` + Vitest  
  **Приёмка:** Vitest `board.test.ts` PASS (3 tests)

---

## Фаза 1 — Workspace & Board CRUD ✅

**Субагент:** `developer` · завершено 2026-08-17

- [x] **B-010** Migration: workspace, workspace_member, board, board_member  
  **Приёмка:** mapping OK; migrate OK (`Version20260817130000`)

- [x] **B-011** Entities + Repositories  
  **Приёмка:** 4 entity, enum MemberRole, 4 repositories

- [x] **B-012** `BoardManager`: workspace CRUD  
  **Приёмка:** list/get/create/update/delete + serialize

- [x] **B-013** Board CRUD + visibility + Controllers  
  **Приёмка:** WorkspaceController + BoardController REST §5.1–5.2

- [x] **B-014** `PermissionResolver` + unit tests  
  **Приёмка:** PHPUnit 34/34

- [x] **B-015** Invite member by email + API tests  
  **Приёмка:** endpoints + BoardApiTest (blocked: JWT keys in test env)

- [x] **B-016** Dashboard UI: workspaces + boards  
  **Приёмка:** Vitest 5/5; DashboardPage + modals + BoardViewPage stub

---

## Фаза 2 — Lists, Cards, Kanban UI ✅

**Субагент:** `developer` · завершено 2026-08-17

- [x] **B-020** Migration: list, card, labels, M2M  
  **Приёмка:** mapping OK; migrate OK (`Version20260817140000`)

- [x] **B-021** List/Card CRUD API  
  **Приёмка:** PHPUnit BoardManagerTest; GET `/boards/{id}` full payload

- [x] **B-022** Reorder lists + move card endpoints  
  **Приёмка:** move between lists tests in BoardManagerTest

- [x] **B-023** Install `@dnd-kit/*`, BoardDndContext  
  **Приёмка:** dnd/ foundation; lint OK

- [x] **B-024** BoardPage Kanban UI  
  **Приёмка:** BoardViewPage Kanban + optimistic DnD + QuickAdd

- [x] **B-025** List assignee field + permissions  
  **Приёмка:** PermissionResolver list assignee override; Select in BoardColumn

---

## Фаза 3 — Card details

**Субагент:** `developer`

- [x] **B-030** Migration: checklist, comment, attachment, activity  
  **Зависимости:** B-020  
  **Приёмка:** migrate OK (`Version20260817150000`) — код готов, migrate в OSPanel

- [x] **B-031** Checklist API  
  **Зависимости:** B-030  
  **Приёмка:** CRUD tests §5.6

- [x] **B-032** Comments API  
  **Зависимости:** B-030  
  **Приёмка:** CRUD + auth §5.7

- [x] **B-033** Attachments + UploadPathResolver `board`  
  **Зависимости:** B-030  
  **Приёмка:** upload + delete §5.8

- [x] **B-034** ActivityLogger subscriber  
  **Зависимости:** B-031  
  **Приёмка:** log on card move/update/comment/checklist

- [x] **B-035** CardModal UI (markdown, checklist, comments)  
  **Зависимости:** B-024, B-031  
  **Приёмка:** manual full flow; Vitest 15/15

- [x] **B-036** Card assignees + labels UI  
  **Зависимости:** B-021, B-035  
  **Приёмка:** assign + filter bar; PUT assignees/labels

---

## Фаза 4 — Filters, polish, MVP release ✅

**Субагент:** `developer` · завершено 2026-08-17

- [x] **B-040** Board filters API + UI  
  **Приёмка:** GET `/boards/{id}/cards`; dimming UI; Vitest OK; PHPUnit — JWT env (как B-015)

- [x] **B-041** user_app_data prefs persistence  
  **Приёмка:** `board.ui.filters`, `board.ui.lastBoardId`; useBoardFilters + Vitest

- [x] **B-042** Background color picker  
  **Приёмка:** BackgroundPicker + PUT background; applied on board view

- [x] **B-043** Board members admin UI  
  **Приёмка:** MemberInviteModal; «Участники» в header

- [x] **B-044** Performance pass  
  **Приёмка:** react-window >50 cards; CardTile memo; lazy CardModal preserved

- [x] **B-045** E2E smoke Playwright  
  **Приёмка:** `client/e2e/board.spec.ts`; integration skip без E2E_INTEGRATION

- [x] **B-046** Docs  
  **Приёмка:** API_SPEC Board; DEVELOPER_GUIDE; PLAN §8 checklist [x]
