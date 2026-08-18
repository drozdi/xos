# ТЗ — PKB (база знаний)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **MVP реализован** (фазы 0–6)

## 1. Назначение

Obsidian-like база знаний: vaults с markdown-заметками, wikilinks, backlinks, graph view, search.

## 2. Пользователи и доступ

- **Claimant:** `pkb`
- **Права:** `can_read`, `can_write`
- Vault-level ACL (owner / reader / editor) — v2 sharing
- Проверка: `canUsePkb()`

## 3. Приложения

| ID | Название | Описание |
|----|----------|----------|
| pkb | База знаний | Vault dashboard + editor |

## 4. Функциональные требования

### Vault
- CRUD vault (root path в Explorer VFS)
- Config `.xos-vault/config.json`
- File tree sidebar

### Редактор
- Live / Source / Reading modes
- Wikilinks `[[Note]]`, `#tags`, embed `![[file]]`
- Attachments (images)
- user_app_data prefs (`pkb.ui.*`)

### Навигация
- Backlinks panel
- Graph view (filter, zoom, ~1000 nodes)
- Vault search
- Bookmarks

### v2 (частично)
- Search/replace across vault
- Templates, sharing vaults

## 5. Архитектура данных

| Слой | Хранение |
|------|----------|
| Контент заметок | Explorer VFS (`home://Vaults/...`) |
| Metadata / index | MySQL (`pkb_vault`, `pkb_note_index`, links) |

## 6. API

**Prefix:** `/api/pkb/`

Детали: [API_SPEC.md](API_SPEC.md)

## 7. Out of scope

Plugin API, encryption, mobile, real-time co-editing — см. [PLAN.md](PLAN.md) v3.

## 8. Критерии приёмки (MVP)

- [x] Vault CRUD + file tree
- [x] Markdown editor (3 modes)
- [x] Wikilinks + backlinks + graph
- [x] Search within vault
- [x] ProtectedAppModules + claimant

## 9. Связанные документы

- [README.md](README.md)
- [PLAN.md](PLAN.md) · [TODO.md](TODO.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) · [API_SPEC.md](API_SPEC.md)
