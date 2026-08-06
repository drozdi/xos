# TODO — Markdown: stale content after save / reopen

> Источник: баг explorer-markdown-viewer (после Save повторное открытие показывает старое содержимое; F5 — актуальное)  
> `docs/PLAN.md` — desktop-state batch (**DONE**), к этой задаче не относится.

## Легенда

- `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована

---

## Итерация 1 — Fix stale markdown after save

**Зависимости:** —  
**Субагент:** `developer` (TS)

- [x] **1.1** После успешного `saveExplorerText` (Save + Save As + save-on-close): обновить RQ `['explorer', 'markdown', path]` через `setQueryData`
- [x] **1.2** Эффект загрузки: skip только при `dirty`; при `!dirty` — `markLoaded`, если query data ≠ store content
- [x] **1.3** HTTP cache — не требуется (симптом = in-memory RQ; `fetchExplorerText` без изменений)
- [x] **1.4** Минимальный дифф; не коммитить

### Диагноз

1. **React Query (основная):** после save кэш не обновлялся → reopen брал stale data.
2. **Store skip (вторичная):** guard `content.length > 0` блокировал apply после save.
3. HTTP cache — не подтвердился.

### Изменённые файлы

- `client/src/apps/explorer-markdown-viewer/ExplorerMarkdownViewerApp.tsx`
