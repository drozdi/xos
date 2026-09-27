# ТЗ — PKB (база знаний)

> Версия: 1.0 · Дата: 2026-08-18 · Статус: **MVP реализован** (фазы 0–6)

## 1. Назначение

Obsidian-like база знаний: vaults с markdown-заметками, wikilinks, backlinks, graph view, search.

## 2. Пользователи и доступ

- **Роль:** `ROLE_PKB` (`ProtectedAppModules`); манифест `requiredRole: 'pkb'`
- **Claimant:** `pkb` — `can_read`, `can_write`
- Vault-level ACL (owner / reader / editor) — sharing
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

### Сверх MVP (DONE)
- Search/replace across vault, templates, sharing
- FULLTEXT search, `encrypt_at_rest`, `plugins_json`, ZIP export
- Remote sync: `remote_sync_url` + `POST /vaults/{id}/remote-sync`
- UI prefs `pkb.ui.*` в `user_app_data` (`getOptional`)

## 5. Архитектура данных

| Слой | Хранение |
|------|----------|
| Контент заметок | Explorer VFS (`home://Vaults/...`) |
| Metadata / index | MySQL (`pkb_vault`, `pkb_note_index`, links) |

## 6. API

**Prefix:** `/api/pkb/` — см. контроллеры `server/src/Pkb/Controller/`, обзор [README.md](README.md).

## 7. Out of scope / backlog

Mobile, real-time co-editing, plugin marketplace — [APP_IDEAS.md](../APP_IDEAS.md).

## 8. Критерии приёмки (MVP)

- [x] Vault CRUD + file tree
- [x] Markdown editor (3 modes)
- [x] Wikilinks + backlinks + graph
- [x] Search within vault
- [x] ProtectedAppModules + claimant
- [x] Remote sync / ZIP / encrypt_at_rest (см. README)

## 9. Связанные документы

- [README.md](README.md)
- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)
- [APP_IDEAS.md](../APP_IDEAS.md)
