# PKB — Developer Guide

> Модуль Personal Knowledge Base в XOS monorepo

## Структура

```
server/src/Pkb/
├── Controller/          # REST endpoints
├── Entity/              # Vault, NoteIndex, PkbLink, VaultMember
├── Repository/
├── Service/
│   ├── PkbManager.php           # vault CRUD, config read
│   ├── VaultFileService.php     # FS proxy + index on save
│   ├── VaultBookmarksService.php
│   ├── LinkIndexService.php     # parse md → index
│   ├── SearchService.php
│   ├── SearchReplaceService.php
│   ├── GraphService.php
│   └── IndexRebuildService.php
├── Parser/WikilinkParser.php
└── Security/Voter/VaultVoter.php

client/src/apps/pkb/           # app shell, routing
client/src/features/pkb/       # UI components, editor extensions
client/src/core/api/endpoints/pkbApi.ts
```

## Добавление фичи (checklist)

### Backend

1. **Service** — бизнес-логика, без HTTP.
2. **Controller** — `#[Route('/api/pkb')]`, `#[Access('pkb')]`, `denyAccessUnlessGranted`.
3. Права vault: `PkbPermissionResolver` (`canReadFiles`, `canWriteFiles`, …).
4. Файлы vault — только через `VaultFileService` (ACL + re-index on `.md` save).
5. Symfony autowire: `Service/` и `Controller/` подхватываются из `config/services.yaml`.
6. **Миграции** — отдельным шагом (не в scope разработчика entity-only задач).

### Frontend

1. **pkbApi.ts** — Zod-схемы + методы axios.
2. **queryKeys.ts** — ключи React Query в секции `pkb`.
3. Компоненты в `features/pkb/components/`.
4. Страницы workspace — `apps/pkb/pages/`.
5. Тесты схем — `core/api/endpoints/__tests__/pkb.test.ts`.

## Index flow

```
PUT /files/content (.md)
  → VaultFileService::putContent
  → ExplorerManager::writeText (owner FS)
  → LinkIndexService::parseAndUpsert
  → pkb_note_index + pkb_link updated
```

Full rebuild: `POST /index/rebuild` → `IndexRebuildService` walk all `.md`.

Search: `SearchService` → `NoteIndexRepository::searchByVault` (title + excerpt).

Search/replace: `SearchReplaceService` → walk index → read file → `str_replace` → `putContent`.

## Конвенции

| Область | Правило |
|---------|---------|
| Paths | Vault-relative (`Notes/foo.md`), не absolute FS |
| Hidden | `.xos-vault/` скрыт из file tree, доступен через API |
| Config | Portable JSON в `.xos-vault/config.json` |
| Bookmarks | `.xos-vault/bookmarks.json` |
| Sharing | Members через `pkb_vault_member`; файлы только через PKB API |
| FE state | React Query для server state; Zustand — markdown editor session |
| UI | Mantine; иконки Tabler |

## Тесты

- **PHP:** `server/tests/Pkb/` — unit/integration с `AuthWebTestCase`, in-memory schema.
- **Client:** Vitest для Zod-схем и чистых helpers.

Запуск:

```bash
cd server && php bin/phpunit tests/Pkb/
cd client && npm test -- src/core/api/endpoints/__tests__/pkb.test.ts
```

## Protected app module

- `server/src/Pkb/setting.json` — claimant `pkb`
- `ProtectedAppModules.php` + `protectedApps.ts` — gate `canUsePkb()`

После deploy: `php bin/console main:claimant:sync`.
