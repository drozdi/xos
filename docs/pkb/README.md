# PKB — база знаний

Personal Knowledge Base: vaults, markdown-заметки, wikilinks, граф, поиск.

## Claimant

- **Код:** `pkb`
- **Права:** `can_read`, `can_write`

## Приложения

| ID | Название | Описание |
|----|----------|----------|
| pkb | База знаний | Vaults, редактор, graph view |

## Backend

```
server/src/Pkb/
├── Controller/
├── Entity/          # Vault, NoteIndex, PkbLink, VaultMember
├── Service/
│   ├── PkbManager.php
│   ├── VaultFileService.php
│   ├── LinkIndexService.php
│   ├── SearchService.php
│   └── GraphService.php
└── setting.json
```

**API prefix:** `/api/pkb/`

Файлы vault хранятся на диске Explorer (не в БД).

## Frontend

```
client/src/apps/pkb/PkbApp.tsx
client/src/features/pkb/
├── components/NoteEditorPanel.tsx
├── components/VaultSearchBar.tsx
└── pkbAccess.ts
```

## Функции

- Несколько vault (private / shared)
- Markdown + wikilinks `[[note]]`
- Backlinks, graph view
- Search & replace по vault
- Шаблоны заметок
- Bookmarks

## Документы

| Файл | Содержание |
|------|------------|
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Структура, checklist фич |
| [API_SPEC.md](API_SPEC.md) | REST endpoints PKB |
| [PLAN.md](PLAN.md) | План фаз 0–6 |
| [BENCHMARK.md](BENCHMARK.md) | Сравнение с аналогами |
| [TODO.md](TODO.md) | Трекинг |

## Доступ

`canUsePkb()` — права модуля pkb.
