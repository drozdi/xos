# XOS — План: per-user хранилище данных приложений (`user_id | code | value`)

> Версия: 2026-08-06  
> Цель: спроектировать и внедрить отдельную KV-таблицу для пользовательских данных модулей (prefs / drafts / UI state), с API CRUD, security «только свой user» и клиентским helper.  
> Формат: `- [ ]` для трекинга оркестратором.  
> **Предыдущий план** (claimants / `setting.json` → `main_claimant.access_options`) — **реализация завершена** (см. `docs/STATUS.md`); ручные UI-smoke 3.5/4.4 — отложены, не блокер. Этот файл **заменён** под текущую задачу.

## Легенда

- **Зависимости:** номера этапов, которые должны быть завершены
- **Параллельность:** `[‖]` — можно выполнять параллельно с указанным этапом
- **Субагент:** рекомендуемый исполнитель

---

## Сводка

| | |
|---|---|
| **Продукт** | Per-user app data store (opaque KV для приложений) |
| **Модель (черновик ТЗ)** | `user_id` + `code` + `value` (+ timestamps) |
| **Не путать с** | `user_settings` (категории USER/APP/WIN), `User.options`, доменными сущностями модулей |
| **Клиент** | новый API endpoint + helper (по аналогии с `settings.ts`, **не** расширение SettingManager) |
| **Сервер** | новая entity/таблица в `App\` (или согласованном namespace), REST CRUD под `/api/...` |

### Scope (in)

1. Новая таблица БД + Doctrine entity + миграция/индексы.
2. REST CRUD: list / get / upsert / delete по `code` для текущего пользователя.
3. Валидация `code` / размера `value`; запрет секретов на уровне политики (документация + лимиты).
4. Клиентский helper + типы/Zod.
5. Документация границ: когда settings / options / домен / новое хранилище.
6. Автотесты (PHPUnit API + vitest helper при наличии).

### Scope out (позже)

- Миграция данных из `User.options` или `user_settings` APP → новая таблица.
- Админ-UI просмотра чужих KV в Main.
- Шифрование at-rest / secret vault.
- Shared/group-scoped KV (только per-user в MVP).
- Версионирование / optimistic lock конфликтов между устройствами (достаточно `updated_at` в ответе).

---

## Контекст: три существующих хранилища

| Хранилище | Где | Назначение | API |
|-----------|-----|------------|-----|
| **`user_settings`** | `App\Entity\UserSetting`, unique `(user_id, category, setting_key)` | Shell/desktop: layout (USER), окна (WIN), launch history / app shell state (APP), defaults (HKEY_CONFIG) | `/api/settings` + клиентский `SettingManager` |
| **`User.options`** | JSON-колонка `main_user.options` | Legacy профильные опции аккаунта (целый blob) | `GET/PUT /api/account/options` |
| **Доменные таблицы** | Todo, Calendar, Device, IncCom, … | Бизнес-сущности модулей | `/api/{module}/...` |

**Граница нового хранилища (рабочая формулировка для Архитектора):**

| Использовать | Когда |
|--------------|--------|
| **`user_settings`** | Состояние рабочего стола / окон / глобальный UX shell; ключи категорий USER\|APP\|WIN; читается SettingManager при старте |
| **`User.options`** | Только legacy account options; **не расширять** новыми app-ключами |
| **Доменные entity** | Данные с бизнес-смыслом, связями, правами claimant, списками/поиском |
| **Новая таблица** | Opaque per-user данные **конкретного приложения**: prefs модуля, черновики форм, UI-state приложения, не являющиеся window geometry и не являющиеся доменной сущностью |

**Не хранить в новой таблице:** пароли, refresh/API tokens, приватные ключи, PII сверх необходимого для prefs (политика: non-secret payload).

---

## ТЗ для Архитектора (не финальная схема)

### Предлагаемые поля

| Поле | Тип (черновик) | Назначение |
|------|----------------|------------|
| `id` | PK int | Суррогатный ключ |
| `user_id` | FK → `main_user`, ON DELETE CASCADE | Владелец |
| `code` | string (лимит длины — ADR; напр. 128–255) | Namespace ключ приложения |
| `value` | JSON | Произвольный JSON-совместимый payload |
| `created_at` | datetime immutable | Создание |
| `updated_at` | datetime immutable | Последний upsert |

**Уникальность:** `UNIQUE (user_id, code)`.

**Индексы:** unique выше; опционально `INDEX (user_id)` если list без prefix-filter достаточен через unique prefix; при list-by-prefix (`code LIKE 'todo.%'`) — уточнить в ADR (MySQL prefix / отдельная колонка `app` vs dotted `code`).

### Соглашение по `code`

Рекомендация плана (утвердить на этапе 0):

- Формат: `{appNs}.{key}` или `{appNs}.{path...}` (например `todo.ui.filters`, `inccom.draft.compose`).
- `appNs` — стабильный идентификатор модуля/приложения (согласовать с `appId` / именем модуля в `setting.json`).
- Запрет: пустой code, пробелы, control chars; опционально whitelist charset `[a-z0-9._-]`.
- **Не** дублировать категории settings (`USER`/`WIN`) внутри code.

Альтернатива на выбор Архитектора: две колонки `(app, key)` вместо одного `code` — тогда unique `(user_id, app, key)`. План допускает оба варианта; выбрать один в ADR.

### Scope данных

| In scope | Out of scope |
|----------|--------------|
| Per-user app prefs | Secrets / credentials |
| Drafts / unsaved form blobs | Shared team/group state |
| App-local UI state (не WIN geometry) | Крупные бинарные вложения (лимит размера JSON) |
| Кросс-девайс sync prefs | Полноценный document DB / query by value |

**Лимиты (зафиксировать в ADR):** max length `code`; max bytes `value` (напр. 16–64 KB); rate — опционально позже.

### API (черновик контракта)

Префикс на выбор Архитектора: `/api/user-data` **или** `/api/app-data` (имя таблицы/entity согласовать).

| Метод | Путь | Поведение |
|-------|------|-----------|
| GET | `/api/...` | Список записей текущего user; query `prefix?` или `app?` |
| GET | `/api/.../{code}` | Одна запись; 404 если нет |
| PUT/POST | `/api/...` | Upsert `{ code, value }` (и/или batch `items[]`) |
| DELETE | `/api/.../{code}` | Удалить; 404 или 204 |

Ответ DTO (черновик): `{ code, value, createdAt, updatedAt }` (+ `id` по необходимости).

Паттерн реализации: как `ApiSettingsController` — `#[CurrentUser]`, 401 без user, upsert в repository.

### Security

| Правило | MVP |
|---------|-----|
| Чтение/запись | Только записи `user_id === currentUser.id` |
| Чужой user_id в теле | Игнорировать / запретить |
| ROOT / ROLE_{module}_ROOT | **По умолчанию нет** доступа к чужим KV; админ-override — open question |
| Auth | JWT / существующий firewall `^/api` → `IS_AUTHENTICATED_FULLY` |
| Claimant scopes | Для opaque prefs обычно **не** нужны; если запись «чувствительна» — это сигнал держать данные в доменном API модуля |

### Клиентский helper

- Файл по аналогии: `client/src/core/api/endpoints/userData.ts` (имя уточнить).
- Zod-схемы + функции `list` / `get` / `upsert` / `delete`.
- **Не** встраивать в `SettingManager` / категории USER|APP|WIN — отдельный контракт.
- Опционально тонкая обёртка `useUserData(code)` позже (не блокер MVP).
- Первый потребитель — одно реальное приложение (smoke); список кандидатов — open question.

### Миграция

- Doctrine migration: CREATE TABLE + unique + FK CASCADE.
- Имя таблицы — ADR (`user_app_data` / `app_user_data` / …); не пересекать с `user_settings`.
- Seed не требуется.
- Откат: drop table (данные только новые).

---

## Ограничения и допущения

### Нельзя ломать

- `/api/settings` и семантику категорий USER/APP/WIN/HKEY_CONFIG.
- `User.options` / `/api/account/options` (legacy).
- Существующие доменные API модулей.
- Auth/JWT firewall.

### Допущения (до ответа на open questions)

1. Новое хранилище **не** заменяет `user_settings` APP — сосуществуют с явной границей в docs.
2. Value — JSON; скаляры допустимы как JSON values.
3. MVP security = только свой user; ROOT read-any — нет, пока не утвердят.
4. Один code = один JSON document (нет partial patch внутри value в MVP; клиент шлёт полный value).
5. Batch upsert — желателен по образцу settings, но можно вторым шагом после single upsert.

---

## Текущие риски / выводы

| Риск | Митигация |
|------|-----------|
| Дублирование с `user_settings` APP | ADR + DEVELOPER_GUIDE: таблица границ; code review первых ключей |
| Раздувание `User.options` вместо новой таблицы | Явный запрет в плане/доках; новые ключи только в KV |
| Секреты в value | Документ политики + лимит размера; не логировать value |
| Коллизии code между приложениями | Обязательный namespace `{app}.…` |
| Большие drafts | Лимит bytes; 413/400 при превышении |
| Путаница имён API (`settings` vs `user-data`) | Разные path prefix и client modules |

---

## План (небольшие шаги)

### Итерация 0 — Контракт Архитектора

**Зависимости:** нет · **Субагент:** architect

- [ ] **0.1** ADR: границы `user_settings` / `User.options` / домен / новое KV; имя таблицы, entity, URL prefix.
- [ ] **0.2** Утвердить схему полей: `code` vs `(app, key)`; типы; unique; timestamps; лимиты code/value.
- [ ] **0.3** Утвердить API DTO + list filter (`prefix` / `app`) + upsert single/batch.
- [ ] **0.4** Security policy: только свой user; решение по ROOT; политика non-secret.
- [ ] **0.5** Обновить черновики в `docs/DATABASE_SCHEMA.md` / `docs/API_SPEC.md` (контракт, ещё без реализации).

**Проверка:**

- [ ] ADR читаем без противоречий с существующим `user_settings`.
- [ ] Open questions ниже закрыты или явно задефолчены в ADR.

---

### Итерация 1 — Backend: миграция + entity + repository

**Зависимости:** 0 · **Субагент:** developer (+ tester)

- [ ] **1.1** Doctrine migration: таблица + UNIQUE `(user_id, code)` + FK CASCADE + индексы.
- [ ] **1.2** Entity + Repository (`findOneByUserCode`, `findByUser`, `upsert`, `delete`).
- [ ] **1.3** Validator: code charset/length, value size, JSON-serializable.
- [ ] **1.4** PHPUnit unit/repository или integration на upsert/unique.

**Проверка:**

- [ ] `php bin/console doctrine:migrations:migrate` (test/dev) — OK.
- [ ] PHPUnit на repository/validator — green.
- [ ] Повторный upsert того же code обновляет `value`/`updated_at`, не создаёт дубликат.

---

### Итерация 2 — Backend: API CRUD + security

**Зависимости:** 1 · **Субагент:** developer (+ tester)

- [ ] **2.1** Controller под утверждённым `/api/...` (list/get/upsert/delete).
- [ ] **2.2** Все операции только для `CurrentUser`; чужой user_id недоступен.
- [ ] **2.3** Коды ошибок: 401 / 400 (validation) / 404 / 413-or-400 (limit).
- [ ] **2.4** PHPUnit WebTest: CRUD happy path + isolation между двумя users + validation.

**Проверка:**

- [ ] PHPUnit API suite — green.
- [ ] User A не читает/не меняет code User B.
- [ ] Неавторизованный запрос — 401.

---

### Итерация 3 — Frontend helper

**Зависимости:** 0.3 (контракт), 2 (для e2e/smoke) · **Субагент:** developer `[‖]` частично после 0 · **tester** vitest

- [ ] **3.1** Types + Zod + `endpoints/*` helper (get/list/upsert/delete).
- [ ] **3.2** Регистрация в barrel `core/api/endpoints` при принятом стиле репо.
- [ ] **3.3** Unit-тест schema/helper (mock client) при наличии паттерна как у settings.
- [ ] **3.4** (Опционально) один smoke-вызов из выбранного приложения-пилота.

**Проверка:**

- [ ] vitest — green.
- [ ] Ручной smoke: upsert → reload → get возвращает value.

---

### Итерация 4 — Документация и границы

**Зависимости:** 0–2 · **Субагент:** tech-writer / developer `[‖]` с 3

- [ ] **4.1** `DATABASE_SCHEMA.md` — финальная таблица + ER.
- [ ] **4.2** `API_SPEC.md` — эндпоинты и DTO.
- [ ] **4.3** `DEVELOPER_GUIDE.md` — когда settings vs KV vs домен; пример code namespace.
- [ ] **4.4** Краткая пометка в `ARCHITECTURE.md` (ADR ссылка).

**Проверка:**

- [ ] Docs согласованы с кодом; нет совета «клади prefs приложения в User.options».

---

### Итерация 5 — Polish / regression

**Зависимости:** 1–4 · **Субагент:** tester

- [ ] **5.1** Regression: `SettingsApiTest` и account options — без регрессий.
- [ ] **5.2** Проверка лимитов (слишком длинный code / большой value).
- [ ] **5.3** Чеклист smoke в `TEST_REPORT.md` (или краткий раздел).

**Проверка:**

- [ ] PHPUnit settings + новый API — green.
- [ ] Чеклист заполнен.

---

## Следующие шаги

### Для Архитектора

1. Закрыть итерацию **0**: ADR + финальные имена (таблица, URL, `code` vs `app+key`).
2. Зафиксировать defaults по open questions ниже (или запросить пользователя).
3. Передать Оркестратору контракт для итераций 1–2.

### Для Оркестратора

1. После ADR — задачи developer: migration → API → client helper → docs.
2. Не смешивать с доработками claimants UI-smoke.
3. Обновить `docs/TODO.md` под этот PLAN (замена трекинга claimants).

---

## Open questions

1. **Имя:** таблица / entity / URL — `user_app_data` + `/api/user-data` vs `app_user_data` + `/api/app-data`?
2. **Модель ключа:** один `code` (`todo.prefs`) или пару `(app, key)`?
3. **ROOT:** нужен ли admin read/write чужих записей в MVP (Main support)? Default плана: **нет**.
4. **Batch:** обязателен ли batch upsert в MVP (как settings) или только single?
5. **Пилот:** какое приложение первым начнёт писать в KV (Todo / IncCom / другое)?
6. **Prefix list:** нужен ли `GET ?prefix=todo.` сразу, или достаточно list all + filter на клиенте?
7. **Патч value:** JSON Merge Patch / JSON Patch в v2 или всегда full replace?
8. **Квота:** жёсткий max bytes value и max keys per user — какие числа?
