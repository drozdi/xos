# TEST_REPORT — Итерация 6 (Open/Save pickers + instance rules)

**Дата:** 2026-08-07  
**Задача:** 6.1–6.4 Unit/integration + smoke checklist  
**Статус:** automated **PASS**; UI smoke — **manual pending**

---

## Команды

```bash
# из client/
npx vitest run \
  src/core/appManager/__tests__/useAppManager.test.ts \
  src/core/appManager/__tests__/launchHistory.test.ts \
  src/features/explorer/__tests__/explorerPickerStore.test.ts \
  src/features/explorer/__tests__/openWithRegistry.test.ts \
  src/core/settings/__tests__/desktopStatePersister.test.ts \
  src/core/windowManager/__tests__/useWmStore.test.ts
```

---

## Результаты

| Suite | Tests | Результат |
|-------|------:|-----------|
| useAppManager.test.ts | 13 | **PASS** (+3: picker skipHistory, multi uuid, audio focus) |
| launchHistory.test.ts | 3 | **PASS** |
| explorerPickerStore.test.ts | 7 | **PASS** (новый) |
| openWithRegistry.test.ts | 5 | **PASS** (новый) |
| desktopStatePersister.test.ts | 3 | **PASS** (регрессия) |
| useWmStore.test.ts | 6 | **PASS** (регрессия) |

**Итого:** 37/37 passed, 0 failed.

---

## Покрытие DoD (auto vs manual)

| DoD | Auto | Manual |
|-----|------|--------|
| Open → отдельный picker, close после выбора, файл в consumer | launch + complete→pendingResults + closeWindow | UI Open из notepad/…, файл в editor |
| Save As → отдельное окно, close, не в history | save appId + skipHistory + cancel/complete close | UI Save As notepad/markdown |
| Reload: picker нет; consumers со своим файлом | skipHistory; restoreFromHistory + WIN.documentPath | F5 / re-login |
| 2+ explorer / notepad / markdown / image / archiver | uuid Start (explorer/notepad); path-key multi openVfs; manifests singleInstance:false | UI 2+ окон markdown/image/archiver |
| Audio/video — одно окно; повторный open грузит файл | singleInstance focus + setOpenRequest reload | UI Open второго файла |
| Dirty-close / save notepad & markdown | нет целевых тестов; соседние suites green | dirty → X → confirm / Save |

---

## Замечания для developer (некритичные)

1. **Replace same picker app (open→open):** unmount cleanup в `ExplorerWorkspace` сравнивает `active.pickerWindowId === windowId`. При reuse `explorer-open-picker__default` теоретически возможен race: cleanup старого инстанса снимет новый `active`. На open→save (разные appId) безопасно. Рекомендация: в cleanup/onClose проверять `active.id === requestId` (из props), не только windowId.
2. **Dirty-close / save:** автотестов нет — только ручной smoke.
3. **Consumer UI** (`useExplorerPickerResult` → editor): unit покрывает store deliver; полный путь в UI — manual.

---

## Вердикт

**Iteration 6 automated: PASS.** DoD UI smoke — checklist ниже, статусы pending.

---

# TEST_REPORT — Итерация 8 (multi notepad windows)

**Дата:** 2026-08-07  
**Задача:** 8.4 verify + code review openVfs / picker consumer / media  
**Статус:** automated **PASS**; UI DoD — **manual pending**

## Команда

```bash
cd client && npx vitest run \
  src/features/explorer/__tests__/openWithRegistry.test.ts \
  src/features/explorer/__tests__/explorerPickerStore.test.ts \
  src/core/appManager/__tests__/useAppManager.test.ts
```

## Результаты

| Suite | Tests | Результат |
|------|------:|-----------|
| openWithRegistry.test.ts | 7 | **PASS** |
| explorerPickerStore.test.ts | 9 | **PASS** |
| useAppManager.test.ts | 13 | **PASS** |

**Итого:** 29/29 passed, 0 failed.

## Code review (read-only)

1. **Multi `openVfsPathWithApp`:** `crypto.randomUUID()` + `props: { documentPath }` — **без** `setOpenRequest` (`openWithRegistry.ts`).
2. **`explorerOpenPickerConsumerId`:** `${appId}:open:${windowId}` — window-scoped; menus/satellite используют его.
3. **Media singleInstance:** `instanceKey: 'default'` + `setOpenRequest` — без регрессии.

## Регрессии

Не найдены в указанных suites. Остаточный риск (не блокер auto): `useExplorerOpenFile(appId)` всё ещё appId-scoped — для multi open-with уже не вызывается `setOpenRequest`; если другой caller положит pending по appId, siblings могут среагировать.

## Вердикт

**Iteration 8 automated verify: PASS.** UI smoke DoD (два notepad, File→Open только одно окно, F5) — manual.
