# TODO — Image viewer: меню Файл → Открыть

> Источник: ТЗ пользователя (чат).  
> `docs/PLAN.md` сейчас про **desktop-state batch** (DONE) — к этой задаче не относится.  
> Образцы: `explorer-notepad/menu.tsx`, `explorer-markdown-viewer/menu.tsx`.

## Легенда

- `[ ]` не начата · `[~]` в работе · `[x]` выполнена · `[!]` заблокирована

---

## Итерация 1 — Image viewer: Open в меню

**Зависимости:** —  
**Субагент:** `developer` (TS)  
**Не трогать:** `explorer-notepad`, `explorer-markdown-viewer` (только читать как образец)  
**Не коммитить**

### Контекст (as-is)

- App: `client/src/apps/explorer-image-viewer/`
- `ExplorerImageViewerApp.tsx`: кнопка «Открыть…» в контенте + `useExplorerSatelliteFile` (`fileTypes: ['image']`)
- `index.ts`: нет `manifest.menu`
- Заголовок уже через `useWindowTitle` / имя файла
- Picker result уже ловится хуком (`useExplorerPickerResult`) — меню достаточно вызвать `openExplorerPicker`

### Задачи

- [x] **1.1** `menu.tsx` — `layout: 'menu'`; Файл → Открыть… (Ctrl+O); `openExplorerPicker` mode open, `fileTypes: ['image']`, `consumerAppId: ctx.appId`; Закрыть через `ctx.coreApi.window.close()`
- [x] **1.2** `index.ts` — `manifest.menu: () => import('./menu').then(...)`
- [x] **1.3** `ExplorerImageViewerApp.tsx` — убрана кнопка/Group «Открыть…»; viewer + placeholder; `openFile` не используется
- [x] **1.4** Минимальный дифф; notepad/markdown в этой задаче не трогались; коммита нет

### Изменённые файлы

- `client/src/apps/explorer-image-viewer/menu.tsx` (новый)
- `client/src/apps/explorer-image-viewer/index.ts`
- `client/src/apps/explorer-image-viewer/ExplorerImageViewerApp.tsx`

### Критерии приёмки

1. [x] Меню приложения: Файл → Открыть…
2. [x] Нет кнопки «Открыть» в области контента
3. [x] Открытие через explorer picker для image types
4. [x] Имя файла в заголовке окна
5. [x] notepad / markdown не изменены этой задачей (dirty от предыдущей — вне scope)
6. [x] Коммита нет
