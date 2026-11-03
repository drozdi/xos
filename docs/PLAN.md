# Аудит проекта XOS (drozdi/xos) — повторная проверка и план оптимизации

- Ревизия: `8c857f6` (2026-11-02 22:09 МСК). Прошлая проверка: `fe33971`.
- Рабочая копия `/workspace/xos` обновлена через `git pull --ff-only`. В репозитории ничего не коммитилось и не пушилось; `git status` чистый.
- Логи этой проверки лежат в `/workspace/xos-audit/logs2/`, прошлой — в `/workspace/xos-audit/logs/`. Прошлый план: `PLAN.prev-fe33971.md`.
- Окружение: Node 22.23.4 (vitest 5 требует node ≥ 22), PHP 8.4 (static), Composer 2. Docker и MySQL на машине аудита нет.
- Шкала приоритетов: критично / высокий / средний / низкий. Трудоёмкость: S ≤ 1 дня, M — 2–5 дней, L — больше недели.

---

## 0. Что изменилось с прошлой проверки

### 0.1 Коммиты и объём изменений
| Коммит | Сообщение |
|---|---|
| 42ad81b | Harden the API and keep the client session out of localStorage |
| 09c355e | Restore the session from the refresh cookie |
| ce84888 | `-` (сообщения нет) |
| 8c857f6 | Store recipe ingredients… |

`git diff --stat fe33971 HEAD`: **370 файлов, +20 484 / −15 269**. Из них 42 добавлено, 86 удалено, 242 изменено. Полный stat: `logs2/diff-stat-fe33971.txt`.

### 0.2 Ключевые метрики: было → стало
| Метрика | Было (fe33971) | Стало (8c857f6) | Источник |
|---|---|---|---|
| Ошибки `tsc -b` | **32** (EXIT 2), `npm run build` падал | **0** (EXIT 0), build проходит | logs2/tsc.txt, build-prod.txt |
| ESLint | 473 проблемы (457 err / 16 warn) | **342** (124 err / 218 warn) | logs2/eslint.txt |
| Vitest | 10 из 414 тестов падают (4 из 69 файлов) | **0 падений**: 428/428 тестов, 75/75 файлов | logs2/vitest.txt |
| PHPUnit | 249 тестов: 32 errors + 11 failures | 250 тестов: **0 errors, 3 failures**, 33 deprecations | logs2/phpunit*.txt |
| Playwright (без бэкенда) | 3 passed / 2 failed / 3 skipped | 3 passed / **2 failed** / 3 skipped (те же два теста) | logs2/playwright.txt |
| phpstan level 5, без baseline | 478 | 446 | logs2/phpstan-l5-nobaseline.txt |
| phpstan level 8, без baseline | 1846 | 1798 | logs2/phpstan-l8-nobaseline.txt |
| phpstan по конфигу репо (l8 + baseline) | конфига не было | **5 ошибок** → server job в CI красный | logs2/phpstan-repo.txt |
| composer audit | 37 advisories в 12 пакетах | **0** | logs2/composer-audit.txt |
| npm audit | 74 (4 crit / 12 high / 55 mod / 3 low) | **50** (0 crit / 1 high / 47 mod / 2 low) | logs2/npm-audit.json |
| Стартовый JS (реальное статическое замыкание от index.html) | 2685 KB raw / **744 KB gz**, 20 файлов | 2274 KB raw / **685 KB gz**, 15 файлов | logs2/startup-closure.txt |
| `check-bundle-size` | — | «зелёный» при 67 KB gz, хотя реально 685 KB gz | logs2/bundle-check.txt |
| PWA precache | 136 записей, 5307 KiB | 135 записей, **739.76 KiB** | logs2/build-prod.txt |
| knip | unused files 120, deps 1, unlisted 8, unresolved 6 | unused files 120, deps **10**, devDeps 4, unlisted 0, unresolved 0 | logs2/knip.txt |
| CI (GitHub Actions) | красный на всех последних прогонах | **всё ещё красный**: server падает на PHPStan; client и mysql зелёные (run 41507333653) | GitHub API |

Оговорки к сравнению:
- **Покрытие vitest:** сейчас 50.38% statements (3472/6891), раньше 7.58% (6351/83758). Цифры **несравнимы**: vitest 5 считает только файлы, которые загрузили тесты, а `coverage.include` не задан.
- **knip:** unused exports 140 → 509 и types 135 → 156. Вероятно, на рост повлияла другая версия knip, поэтому сравнивать надо осторожно.

### 0.3 Что исправлено (подтверждено)
| Прошлая находка | Статус | Факт |
|---|---|---|
| 1.2 Встроенный браузер: `allow-same-origin` + токены в localStorage | ✅ | `BrowserApp.tsx:236` — sandbox `allow-scripts allow-forms allow-popups`. `tokenStorage.ts`: access-токен в памяти (Map), legacy-ключи удаляются, refresh — HttpOnly-cookie `xos_refresh` / `xos_app_refresh` (SameSite=Lax). `RefreshCookieSubscriber.php:48` убирает `refresh_token` из JSON |
| 1.3 SSRF в BrowserProxy | ✅ (почти) | `NoPrivateNetworkHttpClient`, timeout 8, max_redirects 3, 5 MB, http/https, порты 80/443, только text/html, CSP + nosniff. Остаток: порт не проверяется на редиректах |
| 1.4 IDOR на файлах, небезопасная загрузка | ✅ / ⚠️ | `FileAccess::canRead` в FileController и FileServeController, attachment + nosniff. FileManager: лимит 20 MB, allowlist расширений, finfo, `random_bytes(16)`. ⚠️ Возможная регрессия — см. 1.5 |
| 1.5 DQL-инъекции | ✅ | allowlist сортировки в User/Software/Type/Accounting-репозиториях; `fieldVal` проверяет имя поля regex-ом. Новый тест `tests/Device/SoftwareTypeQueryTest.php` |
| 1.6 Уязвимые зависимости PHP | ✅ | Symfony 7.4.22 LTS, twig 3.30.0; composer audit = 0 |
| 1.7 Нет rate limiting | ✅ | `limiter.public_api` (30/мин на IP) на register, proxy, refresh, `*/upload`; `login_throttling` 5/15 мин на 4 json_login-файрволах |
| 1.8 Шифрование токенов | ✅ | общий `App/Service/TokenCipher` (`enc:v1:`, AES-256-GCM); в prod бросает исключение без ключа (`'prod' === $environment`, например `FnsTokenCipher.php:19`, `GithubTokenCipher.php:19`). Команды `ReencryptTokenSecretsCommand`, `ReencryptSshSecretsCommand` |
| 1.8 XSS через `dangerouslySetInnerHTML` | ✅ | `shared/sanitizeHtml.ts` (DOMPurify) в `EventDetailModal:61/67/73` и office viewer `:75` |
| 2.1 tsc / build | ✅ | 0 ошибок |
| 2.2 react-hooks в ESLint | ✅ (подключён) | но теперь виден 22 error `rules-of-hooks` — см. 2.2 |
| 2.6 `queryClient` Infinity / retry false | ✅ | `staleTime: 30_000`, `retry: 1` |
| 2.6 `AuthFileImage` без alt | ✅ | `AuthFileImage.tsx:8,47` — проп `alt` |
| 2.7 axe | ✅ (частично) | `@axe-core/playwright` в `e2e/smoke.spec.ts:1` |
| 3.1 PHPUnit 43 падения | ✅ (почти) | осталось 3 — см. 3.1 |
| 3.2 phpstan: часть реальных багов | ✅ частично | DeviceManager setDefault (стр. 252/268), `ApiAccountController:132`, `ApiLoginController:57` |
| 3.3 SSE держит воркер | ✅ частично | опрос каждые 5 с, 10–120 с (по умолчанию 55); опционально Mercure. SSH вынесен в `ssh-gateway` (Node), PHP `SshStream` остался как fallback |
| 3.4 N+1 на доске | ✅ | `findByBoardWithRelations` с join меток и исполнителей; индекс `IDX_BOARD_CARD_LIST_UPDATED` |
| 3.6 Ошибки API | ✅ | `ApiExceptionSubscriber`: 403/HttpException/400/500, detail вне prod; добавлен `monolog.yaml` |
| 4 Миграции | ✅ частично | baseline `Version20260801000000` + `baseline.sql.php` (92 CREATE TABLE); `server/update` больше не делает `make:migration`; CI mysql job проходит `schema:validate` |
| 5.1 CI | ✅ частично | кэш composer, `.env`, JWT keygen, composer audit, phpstan, MySQL job, typecheck, Playwright smoke, npm audit |
| 5.2 Docker | ✅ появился | multi-stage Dockerfile, docker-compose (app, mercure, ssh-gateway, mysql). Есть проблемы — см. 5.2 |
| 5.3 pre-commit | ✅ | `.husky/pre-commit` → lint-staged (eslint, php-cs-fixer); `.github/dependabot.yml` |
| 8 Гигиена: env, кэши | ✅ частично | из индекса убраны `server/.env.dev`, `client/test-results`, `server/.phpunit.cache`, `bin/.phpunit.result.cache`. `.htaccess` в корне больше не отдаёт произвольные файлы |
| 2.5 Дубль таблицы inccom | ✅ | удалено около 86 файлов |

### 0.4 Что осталось и что появилось нового (кратко)
- **Осталось:**
  - прод-креды в истории git;
  - CI красный (теперь из-за PHPStan);
  - стартовый бандл 685 KB gz;
  - ложный `check-bundle-size`;
  - phpstan-ошибки в License и SubDeviceController;
  - `symfony.exe` в git;
  - перечисление пользователей (`limit=-1`);
  - SSH без запрета приватных сетей;
  - `offlineOutbox` listener без снятия;
  - крупные файлы;
  - 2 e2e-теста.
- **Новое:**
  - 5 ошибок phpstan по конфигу репо (устаревший baseline, ошибки разбора phpDoc);
  - 3 падения PHPUnit (`main_user_group`);
  - 22 ошибки `rules-of-hooks`;
  - небезопасные дефолты Docker/compose;
  - ssh-gateway без TLS, лимитов и lockfile;
  - вероятная регрессия общих картинок из-за `FileAccess` (только владелец);
  - нет `trusted_proxies`, что влияет на rate limit и флаг Secure у cookie;
  - закоммичен `.php-cs-fixer.cache`;
  - `client/coverage/` не в `.gitignore`;
  - e2e-тесты устарели после переноса токенов из localStorage.

---

## 1. Безопасность

### 1.1 Прод-креды в истории публичного репозитория — **критично**, S (ротация) + M (история)
**Факты**
- `git log --all -- server/.env.prod`: коммиты `26714be` и `d4025bd` по-прежнему в истории. В них DSN `mysql://xos:****@ruvip69.hostiman.ru:3324/xos` и `APP_SECRET=7293…883c`.
- Содержимое `server/.env.dev` есть в истории вплоть до `42ad81b`: файл удалён из дерева, но не из истории.
- В текущем дереве старого `APP_SECRET` нет — проверено `git grep`.
- Была ли ротация, снаружи проверить нельзя.

**Шаги**
1. Сменить пароль БД и `APP_SECRET`, JWT passphrase и ключи. Затем перешифровать токены и SSH-секреты командами `ReencryptTokenSecretsCommand` / `ReencryptSshSecretsCommand`. Задать отдельный `SSH_SECRET_KEY`: пока его нет, используется `APP_SECRET`.
2. Закрыть доступ к MySQL-порту 3324 извне или ограничить его по IP.
3. **Только с явного согласия владельца:** переписать историю (`git filter-repo --path server/.env.prod --path server/.env.dev --invert-paths`) и сделать force-push, после чего все пересоздают клоны. Ротация (п. 1) обязательна в любом случае: публичные форки и клоны уже существуют.

### 1.2 SSH: доступ во внутреннюю сеть и ssh-gateway — **средний**, M
**Факты**
- В `server/src/Ssh/` нет проверки хоста на приватные диапазоны (поиск `private|127.|10.|192.168` ничего не находит). Пользователь может подключиться к любому хосту внутренней сети сервера.
- `ssh-gateway/index.mjs` (новый):
  - соединение по `ws://` без TLS;
  - нет проверки Origin (частично компенсирует одноразовый тикет с TTL 30 с);
  - нет idle-timeout и лимита размера сообщения;
  - тестов нет.
- Эндпоинт redeem отдаёт расшифрованные `password` / `private_key` по HTTP от API к gateway. Защита — `X-Gateway-Secret` с `hash_equals`; файрвол `/api/ssh/gateway/(redeem|release)` настроен как `security: false`.
- Если gateway не настроен (в `.env.example` он закомментирован), работает PHP `SshStream` с `set_time_limit(0)`, который держит воркер.

**Шаги**
- запрет приватных сетей или allowlist хостов на стороне API, перед выдачей тикета;
- TLS через reverse proxy (`wss://`) и проверка Origin;
- idle-timeout и `maxPayload` в `ws`;
- redeem — только по внутренней сети (docker network) или по mTLS;
- lockfile и `npm ci` (см. 5.2);
- по умолчанию включить gateway и удалить fallback `SshStream`.

### 1.3 Прочее — **средний/низкий**, S
- **Перечисление пользователей** (осталось): `UserSelectController` — `limit` по умолчанию `-1` (стр. 22, 38). Шаг: ограничить лимит сверху (100) и отдавать только id/имя.
- **Нет `trusted_proxies`** (новое значение после введения IP-лимитов):
  - за reverse proxy все пользователи получат один IP: limiter на 30 запросов в минуту и login_throttling станут общими;
  - `RefreshCookie` ставит Secure только при `$request->isSecure()`, поэтому за TLS-терминатором cookie уйдёт без Secure.
  - Шаг: `framework.trusted_proxies` / `trusted_headers` из env.
- **Прокси браузера:** порт 80/443 проверяется только на исходном URL, не на редиректах. Шаг: проверять каждый hop (`max_redirects: 0` и ручной цикл).
- **`InvalidArgumentException` → 400 с сырым сообщением** (`ApiExceptionSubscriber`): возможна утечка внутренних деталей. Шаг: отдельный `UserFacingException`.
- **`sanitizeHtml`**: в allowlist нет `table`/`img`, поэтому таблицы и картинки docx пропадают в office viewer (низкий). Шаг: добавить `table/thead/tbody/tr/td/th`, `img` с `data:`.
- **inccom `Axios-Interceptor.ts:209-229`** всё ещё пишет токены в localStorage. Файл мёртвый (knip: unused, исключён из tsc) — удалить.
- **`/api/network/egress`** (новый, `EgressAddressService`) раскрывает внешний IP сервера. Проверить, что он доступен только админам.

### 1.4 Зависимости — **средний**, S
**Факты**
- npm: 1 high — `@tiptap/core ≤ 3.30.4` (`__proto__` в mergeAttributes, ReDoS), фикс доступен. Плюс 47 moderate: расширения tiptap, eslint, typescript-eslint, vite-plugin-pwa.
- В CI `npm audit` стоит с `continue-on-error: true`, поэтому сборку не роняет никогда.
- composer: уязвимостей 0. Остались только мажорные обновления: Symfony 8.1, dbal 4, doctrine-bundle 3, gesdinet 3, phpseclib 4, phpunit 13, monolog-bundle 4.

**Шаги**
- обновить tiptap до ≥ 3.30.5 и сделать `npm audit fix`;
- в CI — `npm audit --audit-level=high` без continue-on-error;
- Symfony 8 / dbal 4 — в фазу «дальше».

### 1.5 `FileAccess` «только владелец» — вероятная функциональная регрессия — **средний**, M
**Факты**
- `Main/Service/FileAccess.php` разрешает чтение только создателю, изменившему файл или `ROLE_ROOT/ADMIN`.
- Общие изображения идут через `AuthFileImage` / `useMainFileUrl`: board `CardModal`, iblock `CoverField` / `IblockImageField` / `ContentView` / `RecipeView`, `RecipesApp`. Другие участники доски или каталога, вероятно, получат 403.
- В рантайме не проверено.

**Шаги**
- voter, который делегирует проверку модулю-владельцу ссылки (board: участник workspace; iblock: право чтения инфоблока);
- тест на чтение файла вторым пользователем.

---

## 2. Клиент (React / TypeScript / Vite)

### 2.1 Стартовая загрузка и ложный бюджет бандла — **высокий**, M
**Факты**
- `dist/index.html` делает preload только для index, rolldown-runtime, mantine, react и theme.
- Но `index-*.js` **статически** импортирует app-announcement, app-board, app-calendar, app-inccom и app-main-group, а чанки mantine, react и theme сами импортируют из app-announcement.
- Реальное замыкание — 15 файлов, **685 KB gz** (`/tmp/closure.mjs`, logs2/startup-closure.txt).
- `app-announcement-*.js`: 1363 KB raw / 412 KB gz, 33 маркера tiptap и 6 prosemirror — редактор попадает в старт.
- `modulePreload.resolveDependencies` убирает app-/editor-чанки из preload. Это создаёт каскад запросов, а не уменьшает объём.
- `check-bundle-size.mjs` суммирует только ссылки из index.html — 68 827 B (≈ 67 KB gz) — и пишет «OK». Проверка «запрещённых маркеров» сканирует те же несколько файлов. Бюджет ложно зелёный.
- Другие крупные чанки: pdf.worker 1236K, app-pkb 488K, pdf viewer 424K, office viewer 416K, ssh 344K, mantine css 332K, calendar 200K, board 180K, react 176K.
- ✅ Precache теперь 740 KiB: `app-*.js` и `editor-*.js` исключены, лимит 400 KB.

**Шаги**
1. Найти, почему `manualChunks` складывает общий код в `app-announcement`. Обычно функция возвращает имя чанка для общих модулей (shared/ui, stores) по первому импортёру. Вынести shared в отдельный чанк (`shared`) и вернуть `app-*` только для `src/apps/<name>/**`.
2. Регистрацию приложений сделать через `lazy(() => import(...))` по манифесту, без статического импорта из index.
3. Переписать `check-bundle-size.mjs`: считать замыкание статических импортов от index.html (как `/tmp/closure.mjs`) и падать при > 250 KB gz или при tiptap/prosemirror в замыкании. Добавить в CI.
4. Удалить `resolveDependencies`, когда замыкание станет маленьким.

### 2.2 ESLint: 124 ошибки, из них 22 `rules-of-hooks`; lint не в CI — **высокий/средний**, S–M
**Факты** (logs2/eslint.txt)
- 342 проблемы: 124 error и 218 warn.
- Топ правил:
  - `no-explicit-any` — 110 (warn);
  - `exhaustive-deps` — 86 (warn);
  - `no-unused-vars` — 32;
  - `no-duplicate-imports` — 23;
  - **`rules-of-hooks` — 22 error**;
  - `no-console` — 18;
  - `method-signature-style` — 11;
  - `no-param-reassign` — 10;
  - `max-lines` — 4: IblockElementApp, IblockPropertyApp, TableData, CardModal.
- Места `rules-of-hooks`:
  - `App.tsx:63`;
  - `CalendarStandaloneApp:38`, `SchooltaskStandaloneApp:38`;
  - table `cell-slot:67`, `cell-toggler:18`;
  - `create-template-context:74`;
  - `createSettingAdapter:69`, `desktopStatePersister:26`, `preloadSettings:7`;
  - `catalogAccess.ts:30-36`;
  - inccom `store.tsx:88`;
  - `use-reload.ts:9-10`;
  - `Setting.ts:185-215`.
- Часть — ложные срабатывания из-за функций с именем `use*`, не являющихся хуками. Остальное — реальные условные хуки.
- В CI (`.github/workflows`) шага lint нет; lint-staged проверяет только изменённые файлы.
- Prettier в этот раз не перезапускался (прошлый раз 754 файла не по формату).

**Шаги**
- разобрать 22 `rules-of-hooks`: переименовать не-хуки, условные вызовы вынести;
- `eslint --fix` (5 автоисправимых);
- добавить `npm run lint -- --max-warnings=<текущее>` в CI.

### 2.3 Тесты клиента — **средний**, S–M
**Факты**
- vitest: 428/428 ✅.
- `coverage.include` не задан, поэтому процент покрытия ничего не значит (см. 0.2).
- Дубль `features/inccom/shared/ui/table/__test__/table-data.test.tsx` остался после удаления копии таблицы.
- В `vite.config` осталась опция `environmentMatchGlobs` (в vitest 5 её нет); работают pragma `// @vitest-environment happy-dom`.
- tsconfig исключает `**/__test__/**` и около 13 путей inccom, поэтому тесты не проходят проверку типов.
- Playwright без бэкенда: те же 2 падения — `calculator-loop.spec.ts:3` и `theme-switch.spec.ts:3`. Тесты подкладывают `localStorage.setItem('xos.access_token' …)` (`theme-switch.spec.ts:7-8`), а клиент после 42ad81b восстанавливает сессию из refresh-cookie. Тесты устарели.
- CI гоняет только smoke «login page», поэтому эти падения CI не видит.
- После прогона покрытия появляется `client/coverage/`, которого нет в `.gitignore`.

**Шаги**
- задать `coverage.include: ['src/**']` и порог;
- удалить дубль теста и `environmentMatchGlobs`;
- в e2e мокать `/api/token/refresh` вместо localStorage и включить их в CI;
- добавить `coverage` в `client/.gitignore`;
- `tsconfig.test.json` с проверкой типов тестов.

### 2.4 Мёртвый код и зависимости — **низкий/средний**, S
**Факты:** knip — 120 неиспользуемых файлов, 10 deps, 4 devDeps (logs2/knip.txt). features/inccom: 1151 ts/tsx-файл, 105 922 строки, 1.5 MB.

**Шаги:** удалить неиспользуемые зависимости и файлы по списку knip, начиная с inccom (включая `Axios-Interceptor.ts`).

### 2.5 Качество кода и крупные файлы — **низкий/средний**, L
**Факты**
- Крупные файлы почти не изменились: CardModal 1091 строка, TableData 1026, boardApi 894, IblockElementApp 870, IblockPropertyApp 862, group-by 841, NoteEditorPanel 835, Window 821.
- Счётчики: около 59 `any`, 8 `ts-ignore`/`eslint-disable`, 265 `useEffect`, 3 `useShallow`, 7 пустых catch.
- Осталась утечка: `core/api/offlineOutbox.ts:295` — `addEventListener('online')` без снятия.

**Шаги**
- снимать listener (или регистрировать его один раз с guard);
- разбить CardModal и TableData на подкомпоненты и хуки;
- профилировать ререндеры (React Profiler) оконного менеджера и Board.

---

## 3. Сервер (Symfony / Doctrine)

### 3.1 PHPUnit: 3 падения — **высокий**, S
**Факты**
- Падают `AuthApiTest::testUserEndpointReturnsProfileWithScopes`, `BoardApiTest::testWorkspaceCrudInviteAndPermissions` и `BoardApiTest::testSearchAndChangesAuthz`.
- У всех трёх причина одна: `no such table: main_user_group`. Схема тестовой БД собирается в `tests/AuthWebTestCase.php:99`, и в неё не попадает связь user↔group.
- После удаления `var/*.db` результат тот же (logs2/phpunit-clean.txt).
- 33 deprecations.

**Шаги:** собирать схему через `SchemaTool::createSchema($em->getMetadataFactory()->getAllMetadata())` или включить в список metadata сущность с join-таблицей; затем разобрать deprecations.

### 3.2 PHPStan: CI красный из-за конфига, реальные баги в baseline — **высокий**, S (CI) + M (баги)
**Факты**
- `server/phpstan.neon`: level 8 + `phpstan-baseline.neon`, в baseline 1401 запись и 1801 ошибка.
- Прогон по конфигу репо: **Found 5 errors** (logs2/phpstan-repo.txt):
  - пути baseline не совпадают с файлами `Device/Entity/Device.php`, `PropertyEnum.php`, `IblockImageRef.php`;
  - `phpDoc.parseError` в `Device.php:447` и `IblockImageRef.php:65`.
- Из-за этого server job в CI падает на шаге PHPStan, а **PHPUnit в CI не запускается вообще**.
- Без baseline: level 5 — 446 ошибок (Device 170, Main 73, IBlock 47, IncCom 45, Board 27, SchoolTask 22, App 11); level 8 — 1798.
- Реальные баги, спрятанные в baseline:
  - `Device/Entity/License.php:72` — `setSoftware` вызывается с 2 аргументами;
  - `License.php:284/297/298` — сущность вызывает методы репозитория (`matching`, `count`, `findByLicense`);
  - `SoftwareController:195-210` — тернарники, которые всегда true;
  - `SubDeviceController:105-184`, `TypeController:217` — `getConnection`/`flush` на nullable EntityManager;
  - 40 «implicitly nullable» (deprecated в PHP 8.4).

**Шаги**
1. Исправить phpDoc в двух файлах и перегенерировать baseline (`phpstan --generate-baseline`). CI позеленеет, PHPUnit начнёт запускаться.
2. Вынести перечисленные баги из baseline и починить. Цель — сокращать baseline на 10–20% за итерацию.
3. Подключить `phpstan-doctrine` и `phpstan-symfony`.

### 3.3 Миграции и индексы — **средний**, S–M
**Факты**
- Индекс `IDX_BOARD_CARD_LIST_UPDATED (list_id, updated_at)` есть только в атрибутах сущности и baseline-SQL. Отдельной миграции для существующих БД нет, поэтому на уже развёрнутых базах индекса не будет.
- Baseline пропускается, если существует `main_user`. 38 файлов миграций.
- CI делает `execute baseline` → `version --add --all` → `migrate` → `schema:validate` и проходит.
- Но скрипт `server/update` вызывает обычный `migrate`. На пустой БД после baseline выполнятся исторические миграции. Этот путь не проверен: локально нет MySQL.

**Шаги**
- миграция `CREATE INDEX IF NOT EXISTS`-эквивалент для board;
- в `update`/entrypoint использовать тот же сценарий, что в CI;
- в CI добавить job «чистая БД + обычный migrate».

### 3.4 Пагинация и крупные классы — **низкий/средний**, L
**Факты**
- `toArray()` — 212 вызовов.
- `MapRequestPayload` / `MapQueryString` используются в 1 файле, `ListQuery` — в 2 (определение и 1 использование), `LoggerInterface` — в 2.
- Крупные классы: SeedXosProjectCommand 2260 строк, BoardManager 2068, SchoolTaskManager 1926, ElementManager 1434, DeviceManager 1135, Device.php 963.

**Шаги**
- DTO + `MapRequestPayload` с Validator для новых и изменяемых эндпоинтов, общий `ListQuery` с максимальным лимитом;
- нормализаторы вместо `toArray()`;
- дробить менеджеры по use-case.

---

## 5. DevOps / CI / Docker

### 5.1 CI — **высокий**, S
**Факты**
- Run 41507333653 (`8c857f6`): server — failure на PHPStan; client — success; mysql — success.
- lint нет; npm audit не блокирует; Playwright — только smoke.

**Шаги:** 3.2 п. 1; добавить lint (2.2), `npm audit --audit-level=high` (1.4), полный e2e с моками (2.3), bundle-бюджет (2.1).

### 5.2 Docker / compose: небезопасные дефолты — **высокий**, M (не запускалось: Docker на машине аудита нет)
**Факты** (по файлам)
- `.dockerignore` содержит `.env*`: шаблон без пути совпадает только в корне контекста, поэтому `server/.env` и `server/.env.test` попадут в образ. Не исключены `server/symfony.exe` и `img/`.
- Dockerfile:
  - не генерирует JWT-ключи;
  - не выставляет владельца `var/`;
  - нет entrypoint с миграциями и `cache:warmup`.
- docker-compose:
  - `APP_ENV: prod` с `APP_SECRET: change-me`, `MERCURE_JWT_SECRET: '!ChangeMe!'`, `SSH_GATEWAY_SECRET: change-me-gateway`;
  - MySQL root/root и xos/xos;
  - **нет volumes**: БД и загрузки теряются при пересоздании контейнера;
  - не заданы `*_TOKEN_SECRET`, поэтому в prod `TokenCipher` бросит исключение при сохранении токена.
- ssh-gateway запускает `npm install` при старте контейнера, lockfile нет.

**Шаги**
- `**/.env*` и `!**/.env.example` в `.dockerignore`, плюс `**/symfony.exe` и `img/`;
- секреты из `.env` (compose `env_file`, или `docker secrets`) без дефолтов;
- volumes для mysql и `public/uploads`/`var`;
- entrypoint: проверка ключей JWT → `doctrine:migrations:migrate` → warmup;
- lockfile для ssh-gateway и `npm ci` в Dockerfile, а не при старте.

### 5.3 Гигиена репозитория — **низкий**, S
**Факты**
- `server/symfony.exe` всё ещё в git: правило `.gitignore` `/symfony.exe` относится к корню, а не к `server/`.
- В корне закоммичен `.php-cs-fixer.cache` (правило `/server/.php-cs-fixer.cache` его не покрывает).
- Коммит `ce84888` без сообщения.
- `.git` весит 137 MB (size-pack 135.71 MiB).

**Шаги**
- `git rm --cached server/symfony.exe .php-cs-fixer.cache` и поправить `.gitignore`;
- осмысленные сообщения коммитов (commitlint в husky);
- при переписывании истории (1.1) заодно убрать бинарники.

---

## 6. Документация и DX — **низкий/средний**, S
**Факты**
- `README.md` — 9 строк.
- `docs/DEVELOPER_GUIDE.md` — 79 строк, в стр. 9 путь OSPanel.
- `TEST_REPORT.md` — пути OSPanel (стр. 13, 108).
- `client/README.md` — шаблон Vite.
- В `docs/` 54 md-файла, 1857 строк, без оглавления.

**Шаги**
- README: быстрый старт (Docker и локально), список env-переменных (`SSH_SECRET_KEY`, `*_TOKEN_SECRET`, `MERCURE_*`, `SSH_GATEWAY_*`), архитектура;
- удалить или обновить `TEST_REPORT.md`, заменить `client/README.md`;
- `docs/README.md` с оглавлением.

---

## 7. Топ-10 актуальных проблем
| # | Проблема | Приоритет | Трудоёмкость | Раздел |
|---|---|---|---|---|
| 1 | Прод-креды (DSN, `APP_SECRET`) в истории git; ротация не подтверждена | критично | S + M | 1.1 |
| 2 | CI красный: 5 ошибок PHPStan (устаревший baseline, parseError) → PHPUnit в CI не запускается; локально 3 падения PHPUnit (`main_user_group`) | высокий | S | 3.1, 3.2, 5.1 |
| 3 | Стартовый JS 685 KB gz (app-announcement с tiptap — 412 KB gz — статически в index); `check-bundle-size` ложно зелёный (67 KB) | высокий | M | 2.1 |
| 4 | Docker/compose: `server/.env` в образе, `change-me`-секреты при `APP_ENV=prod`, нет volumes и JWT-ключей | высокий | M | 5.2 |
| 5 | 22 ошибки `rules-of-hooks`, всего 124 ESLint error; lint не в CI | высокий/средний | S–M | 2.2 |
| 6 | SSH: нет запрета приватных сетей; ssh-gateway без TLS, лимитов и lockfile; fallback `SshStream` держит воркер | средний | M | 1.2 |
| 7 | `FileAccess` «только владелец» вероятно ломает общие картинки досок и каталогов | средний | M | 1.5 |
| 8 | Нет `trusted_proxies` (общий IP в лимитах, cookie без Secure за прокси); индекс board без миграции; путь `update`/`migrate` на чистой БД не проверен | средний | S–M | 1.3, 3.3 |
| 9 | tiptap high CVE + 47 moderate, npm audit не блокирует; 1801 ошибка в phpstan baseline, включая реальные баги (`License.php`, `SubDeviceController`) | средний | S + M | 1.4, 3.2 |
| 10 | Гигиена и DX: `symfony.exe` и `.php-cs-fixer.cache` в git, OSPanel в доках, шаблонный client README, устаревшие e2e, `coverage.include`, 10 лишних deps, крупные файлы | низкий/средний | S–L | 2.3–2.5, 5.3, 6 |

---

## 8. Дорожная карта

### Неделя
| # | Задача | Приоритет | Трудоёмкость |
|---|---|---|---|
| 1 | Ротация пароля БД, `APP_SECRET`, JWT; перешифровка; `SSH_SECRET_KEY`; закрыть порт MySQL (1.1) | критично | S |
| 2 | Починить phpDoc, перегенерировать baseline → CI зелёный (3.2) | высокий | S |
| 3 | Схема тестовой БД с `main_user_group` → PHPUnit 0 падений (3.1) | высокий | S |
| 4 | `.dockerignore` (`**/.env*`), убрать дефолтные секреты из compose, добавить volumes (5.2) | высокий | S |
| 5 | Разобрать 22 `rules-of-hooks`, `eslint --fix`, lint в CI (2.2) | высокий | S–M |
| 6 | tiptap ≥ 3.30.5, `npm audit fix`, audit high блокирующий (1.4) | средний | S |
| 7 | `trusted_proxies`; миграция индекса board (1.3, 3.3) | средний | S |
| 8 | `git rm --cached` `symfony.exe`, `.php-cs-fixer.cache`; `coverage` в `.gitignore` (5.3) | низкий | S |

### Месяц
| # | Задача | Приоритет | Трудоёмкость |
|---|---|---|---|
| 1 | Перестроить `manualChunks` и lazy-регистрацию приложений; честный bundle-бюджет в CI (2.1) | высокий | M |
| 2 | Voter для файлов по модулю-владельцу + тест второго пользователя (1.5) | средний | M |
| 3 | SSH: запрет приватных сетей, `wss`, idle-timeout/maxPayload, lockfile, gateway по умолчанию (1.2) | средний | M |
| 4 | Docker entrypoint (JWT, migrate, warmup), job «чистая БД + migrate» (5.2, 3.3) | средний | M |
| 5 | Вынести реальные баги из phpstan baseline (License, SubDevice, Type, Software); phpstan-doctrine (3.2) | средний | M |
| 6 | e2e с моком refresh-cookie в CI; `coverage.include` и порог (2.3) | средний | S–M |
| 7 | Лимит в `UserSelectController`, порт на редиректах прокси, `UserFacingException` (1.3) | средний | S |
| 8 | README, переменные окружения, оглавление docs, удалить OSPanel (6) | низкий | S |

### Дальше (1–3 месяца)
- Разбить крупные классы и компоненты: BoardManager, SchoolTaskManager, CardModal, TableData (2.5, 3.4).
- DTO + Validator + общий `ListQuery` на всех списках (3.4).
- Чистка inccom по knip (2.4).
- Сокращать phpstan baseline до нуля, затем level 9.
- Symfony 8.1, dbal 4, doctrine-bundle 3, phpunit 13 (1.4).
- Профилирование ререндеров, `jsx-a11y` (2.5).
- Переписать историю git с согласия владельца (1.1).

---

## 9. Что не удалось проверить
- **Docker build / compose up** — Docker на машине аудита не установлен (зеркало apt заблокировано). Выводы раздела 5.2 сделаны по файлам.
- **Миграции на реальном MySQL локально** — MySQL нет. Использован результат CI job mysql (success). Путь `server/update` (обычный `migrate` на чистой БД) не проверен.
- **Регрессия `FileAccess` для общих картинок** — нужен запущенный бэкенд с двумя пользователями; вывод сделан по коду.
- **Прод-конфигурация и ротация утёкших секретов** — снаружи не проверить.
- **Интеграционные Playwright-тесты с бэкендом** (3 skipped) — нужен рабочий API и БД.
- **Ререндеры и утечки памяти в рантайме** — профилирование не проводилось.
- **phpstan-doctrine / psalm** — не установлены в проекте, не запускались.
- **Prettier `--check`** в этот раз не перезапускался.
- **Сравнимость метрик:** процент покрытия vitest и счётчики knip unused exports/types между прогонами несравнимы (см. 0.2).
