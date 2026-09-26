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
- Markdown + wikilinks `[[note]]` (+ ambiguous picker)
- Backlinks, graph view, FULLTEXT search
- Search & replace по vault
- Шаблоны заметок, bookmarks
- `encrypt_at_rest`, plugins_json, ZIP export
- Remote sync: `remote_sync_url` + `POST /vaults/{id}/remote-sync`

## Документы

| Файл | Содержание |
|------|------------|
| [TZ.md](TZ.md) | Техническое задание |
| [APP_IDEAS.md](../APP_IDEAS.md) | Бэклог (co-edit, marketplace) |

## Доступ

`canUsePkb()` — права модуля pkb.
