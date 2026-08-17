# PKB — REST API Specification

> Версия: 2026-08-17  
> Prefix: `/api/pkb`  
> Auth: JWT Bearer + module gate `#[Access('pkb')]`

## Общие соглашения

- Все эндпоинты требуют `Authorization: Bearer {token}`.
- Доступ к модулю PKB — через claimant `pkb` (`can_read` / `can_write`).
- Vault-level права (owner / reader / editor) — в `permissions` объекта vault и через `VaultVoter`.
- Ошибки: `{ "error": "..." }` или Symfony validation format (400).

---

## Utility

### GET `/api/pkb/health`

**Auth:** JWT + pkb module  
**Response 200:**
```json
{ "status": "ok" }
```

---

## Vaults

### GET `/api/pkb/vaults`

**Auth:** JWT + pkb  
**Response 200:** `PkbVaultSummary[]`

### POST `/api/pkb/vaults`

**Auth:** JWT + pkb  
**Request:**
```json
{ "name": "My Vault", "slug": "my-vault", "rootPath": "home://Vaults/my-vault/" }
```
**Response 201:** `PkbVaultDetail`

### GET `/api/pkb/vaults/{id}`

**Response 200:** `PkbVaultDetail` (includes `config`, `permissions`)

### PUT `/api/pkb/vaults/{id}`

**Request:** `{ "name": "..." }`  
**Response 200:** `PkbVaultDetail`

### DELETE `/api/pkb/vaults/{id}?deleteFiles=false`

**Response 200:** `{ "ok": true }`

### GET `/api/pkb/vaults/{id}/members`

**Auth:** owner  
**Response 200:** member list

### POST `/api/pkb/vaults/{id}/members`

**Request:** `{ "email": "...", "role": "reader" | "editor" }`  
**Response 200:** member list

### PUT `/api/pkb/vaults/{id}/members/{userId}`

**Request:** `{ "role": "reader" | "editor" }`

### DELETE `/api/pkb/vaults/{id}/members/{userId}`

---

## Files (vault-scoped)

### GET `/api/pkb/vaults/{id}/files/tree?path=&depth=3`

**Response 200:** tree node `{ name, path, type, children?, extension? }`

### GET `/api/pkb/vaults/{id}/files/content?path=`

**Response 200:**
```json
{ "path": "Notes/foo.md", "content": "..." }
```

### PUT `/api/pkb/vaults/{id}/files/content`

**Auth:** vault write  
**Request:** `{ "path": "Notes/foo.md", "content": "..." }`  
**Response 200:** file entry + optional `index` (for `.md`)

### POST `/api/pkb/vaults/{id}/files/folder`

**Request:** `{ "path": "Notes/sub" }`

### POST `/api/pkb/vaults/{id}/files/upload`

**Multipart:** `path` (folder), `file`

### PATCH `/api/pkb/vaults/{id}/files/rename`

**Request:** `{ "fromPath": "...", "toPath": "..." }`

### DELETE `/api/pkb/vaults/{id}/files/item?path=`

**Response 200:** `{ "ok": true }`

---

## Bookmarks

Хранятся в `.xos-vault/bookmarks.json` (portable).

### GET `/api/pkb/vaults/{id}/bookmarks`

**Response 200:**
```json
{
  "version": 1,
  "items": [
    { "path": "Notes/foo.md", "title": "Foo", "addedAt": "2026-08-17T12:00:00+00:00" }
  ]
}
```

Пустой файл создаётся при первом GET (если есть права на запись).

### PUT `/api/pkb/vaults/{id}/bookmarks`

**Auth:** vault write  
**Request:**
```json
{
  "items": [
    { "path": "Notes/foo.md", "title": "Foo", "addedAt": "2026-08-17T12:00:00+00:00" }
  ]
}
```
**Response 200:** bookmarks document (same shape as GET)

---

## Index, links, graph, search

### GET `/api/pkb/vaults/{id}/notes`

**Response 200:** `{ "notes": [{ path, title, tags, inbound_count, outbound_count }] }`

### GET `/api/pkb/vaults/{id}/notes/by-title?title=`

**Response 200:** `{ path, title, ambiguous, candidates? }`

### GET `/api/pkb/vaults/{id}/backlinks?path=`

**Response 200:** `{ "backlinks": [{ sourcePath, sourceTitle, linkType, alias? }] }`

### GET `/api/pkb/vaults/{id}/graph?filter=&limit=1000`

**Response 200:** `{ "nodes": [...], "edges": [...] }`

### GET `/api/pkb/vaults/{id}/search?q=`

**Response 200:** `{ "results": [{ path, title, excerpt, tags, score }] }`

### POST `/api/pkb/vaults/{id}/search/replace`

**Auth:** vault write  
**Request:**
```json
{ "find": "old", "replace": "new", "dryRun": false }
```
**Response 200:**
```json
{
  "matchedFiles": 3,
  "replacedFiles": 3,
  "paths": ["Notes/a.md", "Notes/b.md"]
}
```

`dryRun: true` — только подсчёт и список путей, без записи.

### GET `/api/pkb/vaults/{id}/index/status`

**Response 200:** `{ stale, noteCount, lastIndexedAt, index_version }`

### POST `/api/pkb/vaults/{id}/index/rebuild`

**Auth:** owner / can_rebuild_index  
**Response 200:** `{ noteCount, indexed, removed, index_version }`

---

## Vault config (`.xos-vault/config.json`)

Возвращается в `GET /vaults/{id}` → `config`:

```json
{
  "version": 1,
  "defaultNoteFolder": "Notes",
  "templatesFolder": "Templates",
  "attachmentFolder": "attachments",
  "dailyNotes": { "enabled": false, "format": "YYYY-MM-DD", "folder": "Daily" },
  "wikilink": { "caseSensitive": false, "extension": ".md" }
}
```
