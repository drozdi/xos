# План — Explorer: pickers, multi-instance, persist

> Версия: 1.0 · Дата: 2026-08-07 · Статус: **выполнено** (итерации 0–8)  
> Трекинг: [TODO.md](./TODO.md)

## Цель

Унифицировать открытие/сохранение файлов через отдельные picker-окна, правила экземпляров приложений и persist пути/файла per-window.

## Scope

| In scope | Out of scope |
|----------|--------------|
| `explorer-open-picker` / `explorer-save-picker` | Синхронизация файлов между устройствами |
| skipHistory для picker | Облачные диски |
| Multi-instance: explorer, notepad, markdown, image, archiver | |
| Single-instance: audio, video | |
| `WIN.documentPath` per window | |
| Window-scoped Open для satellite apps | |

## Итерации (кратко)

0. **Контракт:** два appId picker, close/cancel flow, documentPath, media singleInstance  
1. **Picker apps:** manifests, ExplorerWorkspace pickerMode, skipHistory  
2. **Изоляция:** picker не использует global explorer store для persist  
3. **Instance rules:** multi vs single по типам приложений  
4. **Persist file:** reload восстанавливает открытый файл  
5. **UX:** Файл → Открыть через picker в media/archiver  
6. **Тесты:** vitest + smoke checklist  
7. **Per-window folder:** каждый explorer помнит свою папку  
8. **Per-window file:** notepad/markdown — независимые окна на разные файлы  

## Приложения (затронуты)

`explorer`, `explorer-open-picker`, `explorer-save-picker`, `explorer-notepad`, `explorer-markdown-viewer`, `explorer-image-viewer`, `explorer-archiver`, `explorer-audio-player`, `explorer-video-player`

## Код

```
client/src/features/explorer/explorerPickerStore.ts
client/src/features/explorer/openWithRegistry.ts
client/src/core/windowManager/   # documentPath
```

## DoD (остаток)

- [ ] Manual: dirty-close/save notepad & markdown после F5
