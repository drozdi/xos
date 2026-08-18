# PKB / Vault — TODO tracker

> Синхронизировать с [`PLAN.md`](./PLAN.md). Обновлять статус задач по мере выполнения.

**Legend:** ⬜ todo · 🔄 in progress · ✅ done · ⏸ deferred (v2+)

---

## Phase 0 — Scaffolding

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-001 | `server/src/Pkb/` skeleton | S | ✅ |
| PKB-002 | `setting.json` + claimant sync | S | ✅ |
| PKB-003 | ProtectedAppModules BE+FE | S | ✅ |
| PKB-004 | `client/src/apps/pkb/` stub | S | ✅ |
| PKB-005 | `pkbApi.ts` + queryKeys | S | ✅ |

## Phase 1 — Vault & files

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-010 | Migration `pkb_vault` | S | ✅ |
| PKB-011 | Vault CRUD API | M | ✅ |
| PKB-012 | VaultFileService (owner) | M | ✅ |
| PKB-013 | `.xos-vault/config.json` init | S | ✅ |
| PKB-014 | Dashboard UI | M | ✅ |
| PKB-015 | Sidebar file tree | M | ✅ |

## Phase 2 — Editor

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-020 | Extract `features/markdown/` | M | ✅ |
| PKB-021 | NoteEditorPanel | M | ✅ |
| PKB-022 | View modes | S | ✅ |
| PKB-023 | Attachments upload | M | ✅ |
| PKB-024 | user_app_data prefs | S | ✅ |

## Phase 3 — Wikilinks & backlinks ⚡ critical

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-030 | Migration index tables | M | ✅ |
| PKB-031 | WikilinkParser PHP | M | ✅ |
| PKB-032 | LinkIndexService on save | M | ✅ |
| PKB-033 | Backlinks API | M | ✅ |
| PKB-034 | TipTap wikilink extension | L | ✅ |
| PKB-035 | Wikilink navigation | M | ✅ |
| PKB-036 | Backlinks sidebar UI | M | ✅ |

## Phase 4 — Graph & search ⚡ critical

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-040 | GraphService + API | M | ✅ |
| PKB-041 | Cytoscape GraphView | M | ✅ |
| PKB-042 | Graph filters | M | ✅ |
| PKB-043 | Graph → open note | S | ✅ |
| PKB-044 | Vault search | M | ✅ |
| PKB-045 | Full reindex | M | ✅ |
| PKB-046 | E2E critical path smoke | M | ✅ |

## Phase 5 — Sharing (v2 boundary)

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-050 | Migration `pkb_vault_member` | S | ✅ |
| PKB-051 | Member invite API | M | ✅ |
| PKB-052 | Shared file ACL | M | ✅ |
| PKB-053 | ShareVaultModal UI | M | ✅ |

## Phase 6 — Polish

| ID | Task | Size | Status |
|----|------|------|--------|
| PKB-060 | Bookmarks | S | ✅ |
| PKB-061 | Templates | M | ✅ |
| PKB-062 | Daily Notes | M | ✅ |
| PKB-063 | Search/replace | M | ✅ |
| PKB-064 | 10k notes benchmark | M | ✅ |
| PKB-065 | Docs API_SPEC | S | ✅ |
| PKB-070 | Markdown note scroll in workspace | S | ✅ |

---

## MVP exit criteria

- [x] PKB-046 E2E green
- [x] Critical path: vault → edit → wikilink → backlinks → graph
- [ ] Claimant sync + app gate verified

## Open questions (Architect)

- [ ] Q4: Sharing in MVP or v2?
- [ ] Q6: FULLTEXT vs LIKE
- [ ] Q2: Ambiguous wikilink UX
