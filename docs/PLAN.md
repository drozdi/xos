# Аудит проекта XOS (drozdi/xos) и план оптимизации

Дата аудита: 01.11.2026 · Ревизия: `master` @ `fe33971` (225 коммитов, первый — 30.04.2025)
Логи всех прогонов: `/workspace/xos-audit/logs/` (имена файлов указаны в квадратных скобках).
Репозиторий не изменялся: ни коммитов, ни push. Локально добавлены только игнорируемые git-ом артефакты (`server/.env`, `server/config/jwt/*.pem`, `var/`, `node_modules`, `dist`). Отслеживаемый файл `server/.phpunit.cache/test-results` перезаписывался phpunit и восстановлен через `git checkout`.

Шкала приоритетов: **критично** (исправить немедленно) · **высокий** (ближайшая неделя–две) · **средний** (в течение месяца) · **низкий** (бэклог).
Трудозатраты: **S** — до 1 дня · **M** — 2–5 дней · **L** — больше недели.

---

## 0. Краткое резюме

XOS — это «веб-ОС» с оконным интерфейсом. Клиент: React 19, TS 5.8, Vite 8, Mantine 9, Zustand, TanStack Query; 1231 файл ts/tsx, ~113,7 тыс. строк. Сервер: Symfony 7.3, Doctrine ORM 3.4, JWT; 82 сущности; модули Main, Device, Board, IBlock, IncCom, SchoolTask, Pkb, Explorer, Ssh, Github и др. Функциональность обширная, но проект в состоянии «прототипа без страховки».

1. **Безопасность — главный риск.**
   - В публичной git-истории лежат прод-креды БД и `APP_SECRET`.
   - Встроенный «браузер» исполняет чужой JS в origin приложения, а токены хранятся в `localStorage`.
   - SSRF в прокси, IDOR на файлах, DQL-инъекции.
   - Нет rate limiting.
   - 37 advisory в composer (twig — critical) и 74 уязвимости в npm.
2. **Сборка и CI сломаны.**
   - Последние 10 запусков CI на `master` красные.
   - `tsc` — 32 ошибки, поэтому `npm run build` падает.
   - ESLint — 473 проблемы.
   - Vitest — 10 из 414 тестов падают; PHPUnit — 43 из 249 (32 errors + 11 failures).
   - Покрытие клиента 7,6 % строк.
3. **Производительность клиента.**
   - Начальная загрузка — 2,7 МБ JS (744 КБ gzip), из них один чанк 1,37 МБ: Mantine, tiptap, zod, axios.
   - Скрипт контроля размера бандла проверяет не те файлы и поэтому проходит ложно.
4. **Производительность сервера.**
   - N+1 в Board.
   - SSE и SSH держат PHP-воркеры по 55–120 с и бесконечно соответственно.
   - Нет индекса под polling-запрос.
5. **DevOps/DX.**
   - Dockerfile нерабочий.
   - Миграции не поднимают чистую БД.
   - Нет README, pre-commit, логирования (monolog не установлен).
   - Окружение заточено под Windows/OSPanel.

Оптимальный порядок работ:
1. Закрыть утечки и критичные дыры (1–2 дня).
2. Вернуть зелёный CI: tsc, тесты, composer-ключи (неделя).
3. Обновить зависимости и закрыть серверные уязвимости (2–3 недели).
4. Перестроить бандл, устранить дублирование и N+1, наладить миграции и Docker (месяц и дальше).

---

## 1. Безопасность

### 1.1 Прод-креды и APP_SECRET в истории публичного репозитория — **критично**, S
**Факты**
- Файл `server/.env.prod` добавлен в коммите `26714be` (29.07.2026) и удалён в `d4025bd` (30.07.2026).
- В нём были:
  - `DATABASE_URL="mysql://xos:****@ruvip69.hostiman.ru:3324/xos"` — пароль замаскирован в этом отчёте;
  - `APP_SECRET=7293…883c`.
- Тот же `APP_SECRET` до сих пор лежит в отслеживаемом `server/.env.dev`.
- Репозиторий публичный: клонировался без авторизации.
- От `APP_SECRET` зависит шифрование SSH-секретов: AES-256-GCM, ключ = sha256(kernel.secret).
- `JWT_PASSPHRASE=xos_jwt_pass` закоммичен в env-файлах.

**Шаги**
1. Сразу сменить пароль MySQL-пользователя `xos` на хостинге и ограничить доступ к порту 3324 по IP.
2. Сгенерировать новый `APP_SECRET` для прода; dev и test должны иметь свои, отличные значения.
3. Перешифровать SSH-секреты. Это одноразовая команда: расшифровать старым ключом, зашифровать новым. Затем отвязать ключ шифрования от `APP_SECRET`, вынеся его в отдельную переменную `SSH_SECRET_KEY`.
4. Перевыпустить JWT-ключи с новой passphrase. Passphrase хранить только в секретах окружения.
5. Почистить историю (`git filter-repo --path server/.env.prod --invert-paths`) и сделать force-push по согласованию. Креды всё равно считать скомпрометированными: форки и клоны уже существуют.
6. Включить GitHub secret scanning и push protection, добавить gitleaks в pre-commit и CI.

### 1.2 Встроенный браузер: чужой JS в origin приложения — **критично**, M
**Факты**
- `client/src/apps/browser/BrowserApp.tsx:235-236` рендерит проксированный внешний HTML через `srcDoc` с `sandbox="allow-scripts allow-same-origin …"`.
- Такое сочетание фактически отменяет sandbox: скрипт страницы получает доступ к `parent` и `localStorage` приложения.
- Токены хранятся в `localStorage`: `client/src/core/auth/tokenStorage.ts:39-51`, ключи `xos.access_token`, `xos.refresh_token`.
- Значит, любая открытая во встроенном браузере страница может украсть сессию.

**Шаги**
1. Немедленно убрать `allow-same-origin`. Лучше вообще отдавать контент с отдельного домена (например, `proxy.<domain>`), а не через `srcDoc`.
2. Добавить CSP на ответ прокси.
3. В перспективе перенести refresh-токен в `HttpOnly; Secure; SameSite=Strict` cookie, а access-токен держать только в памяти.

### 1.3 SSRF в BrowserProxyController — **высокий**, M
**Факты** (`server/src/…/BrowserProxyController.php`)
- Строки 68-110 блокируют только литеральные IP.
- Нет DNS-резолва, поэтому имена вида `internal.local` и DNS-rebinding проходят.
- Не покрыты диапазоны:
  - `169.254.0.0/16` (cloud metadata);
  - `100.64.0.0/10`;
  - `0.0.0.0/8`;
  - IPv6 в скобках `[::1]`;
  - `::ffff:127.0.0.1`;
  - `fc00::/7` (проверяются только префиксы `fc00`/`fd00`).
- Строки 29-30: до 5 редиректов без повторной валидации адреса.
- Нет лимита размера ответа; таймаут 20 с; используется `file_get_contents`.

**Шаги**
1. Перейти на `symfony/http-client` с `NoPrivateNetworkHttpClient`: он проверяет IP после резолва и на каждом редиректе.
2. Ограничить `max_redirects`, размер ответа (например, 5 МБ, через стриминг) и таймаут (5–10 с).
3. Разрешить только схемы http/https и порты 80/443.
4. Добавить rate limit на эндпоинт (см. 1.7).

### 1.4 IDOR на файлах и небезопасная загрузка — **высокий**, M
**Факты**
- `Main/Controller/FileController.php:50-70`:
  - `GET /api/main/file/{id}` отдаёт любой `MainFile` по последовательному id любому аутентифицированному пользователю;
  - блокируется только модуль `task`;
  - отдача идёт inline с сохранённым MIME, а это хранимый XSS через загруженный HTML или SVG.
- `FileServeController` `/uploads/{module}/{subDir}/{fileName}` тоже не проверяет владельца.
- `Main/Service/FileManager.php:27-85`:
  - сохраняется исходное имя и расширение клиента;
  - нет allowlist расширений и MIME, нет лимита размера;
  - для переименования используется `md5(mt_rand())`, каталоги создаются с правами `0775`.
- Неверный module/subDir бросает `InvalidArgumentException`, что даёт 500 вместо 400.
- Корневой `.htaccess` отдаёт любой существующий файл (`RewriteCond %{REQUEST_FILENAME} -f`). Если DocumentRoot — корень репозитория, наружу доступны:
  - `server/.env`;
  - `server/config/jwt/*.pem`;
  - `server/var/*.db`;
  - `server/var/uploads` (включая загруженные `.php`).
  
  Конфигурацию прод-развёртывания проверить не удалось.

**Шаги**
1. Ввести проверку доступа (Voter) для файла: владелец, участник доски или задачи, права модуля. Это нужно в обоих контроллерах.
2. Отдавать файлы с `Content-Disposition: attachment` и `X-Content-Type-Options: nosniff`. Для HTML и SVG — только attachment.
3. Ввести allowlist расширений и MIME (через `finfo`), лимит размера и имя `bin2hex(random_bytes(16))`; хранить без исполняемого расширения.
4. DocumentRoot должен указывать строго на `server/public`; корневой `.htaccess` удалить или ограничить.
5. Маппить `InvalidArgumentException` в 400 (см. 3.6).

### 1.5 DQL-инъекции — **высокий**, S
**Факты**
- `Device/Repository/Software/TypeRepository.php:46-63` переопределяет `fieldVal` с прямой интерполяцией (`'{$val}'`, `IN ('".implode(...)."')`), а ключи фильтра `$f` приходят из запроса.
- `addOrderBy` с непроверенным `$sortBy['key']` встречается в:
  - `Main/Repository/UserRepository.php:125`;
  - `Device/Repository/TypeRepository.php:110`;
  - `SoftwareRepository.php:69`;
  - `Software/TypeRepository.php:71`;
  - `AccountingRepository.php:58`.
- Безопасная реализация уже есть в `AbstractRepository::fieldVal` (regex и квотирование).

**Шаги**
1. Удалить переопределение и использовать параметры (`setParameter`).
2. Сортировку разрешать только по allowlist полей, направление — только `ASC`/`DESC`.
3. Добавить тест с вредоносным `sortBy` и фильтром.

### 1.6 Уязвимые зависимости — **высокий**, M
**Факты**
- `composer audit` [composer-audit.txt] — 37 advisory в 12 пакетах:
  - `twig/twig` 3.21.1 — 16 advisory, включая critical CVE-2026-46633;
  - `symfony/security-http` — обход firewall, CVE-2026-48489;
  - `http-foundation`, `yaml`, `mime`, `routing`, `runtime`, `cache`, `phpunit`, `web-profiler`.
- Все пакеты Symfony зафиксированы на 7.3.0, а ветка 7.3 — EOL.
- Устарели: `doctrine/orm` 3.4.0 (доступна 3.7.6), `lexik/jwt` 3.2, `nelmio/cors` 2.6.1.
- `npm audit` [npm-audit.json] — 74 уязвимости: 4 critical, 12 high, 55 moderate, 3 low.
  - Critical: vitest, tinypool, seroval, solid-js.
  - High: axios, follow-redirects, react-router(-dom), prosemirror-view (XSS), @tiptap/core, zod, vite, nanoid, js-yaml, brace-expansion, source-map-js.

**Шаги**
1. Обновить Symfony до 7.4 LTS одним шагом: `extra.symfony.require: "7.4.*"`, `composer update "symfony/*"`. Затем обновить twig, doctrine/orm, lexik и nelmio. Дальше планировать переход на 8.x.
2. Выполнить `npm audit fix` и обновить vitest до актуального мажора (заодно исчезнет вложенный vite 7.3.6), а также axios, react-router, tiptap и zod.
3. Включить Dependabot или Renovate и шаги `composer audit` и `npm audit --audit-level=high` в CI.

### 1.7 Нет rate limiting / brute-force защиты — **высокий**, S
**Факты**
- По `rate_limiter` и `login_throttling` 0 совпадений.
- Публичные логины: `/api/login`, `/api/calendar/auth/login`, `/api/IncCom/auth/login`, `/api/schooltask/auth/login`.
- Публичная регистрация: `/api/IncCom/auth/register`.

**Шаги**
1. Установить `symfony/rate-limiter`.
2. Включить `login_throttling` на всех firewall с json_login.
3. Добавить limiter (sliding window) на register, browser-proxy, upload и refresh.

### 1.8 Прочие вопросы безопасности — **средний**, S–M

**Перечисление пользователей**
- `UserSelectController` `/api/main/user/select` отдаёт любому аутентифицированному пользователю список всех пользователей.
- `limit=-1` снимает ограничение.
- Шаги: ограничить лимит сверху (100) и возвращать только нужные поля.

**XSS через `dangerouslySetInnerHTML` без санитайзера**
- `apps/schooltask/…/EventDetailModal.tsx:60/66/72` — серверные поля `ht`, `pt`, `des`.
- `explorer-office-viewer:74` — HTML из mammoth.
- Шаги: подключить DOMPurify. Подсветку hljs в `code viewer:124` можно оставить.

**Шифрование токенов**
- Отдельные шифраторы есть у SSH, Ts (`TsTokenCipher`), Pkb, Yandex, FNS (`FnsTokenCipher`) и GitHub (`GithubConnectionService.php:114`).
- Yandex и FNS без env-ключа (`YANDEX_DISK_TOKEN_SECRET`, `INCCOM_FNS_SECRET`) молча пишут plaintext: см. комментарий в `FnsTokenCipher.php:9`.
- Шаги:
  - в prod падать при отсутствии ключа;
  - вынести общий `TokenCipher` (AES-256-GCM, versioned prefix) вместо 5–6 копий;
  - сделать миграцию для перешифровки plaintext-записей.

**SSH-терминал**
- `SshStream` вызывает `set_time_limit(0)` и не ограничивает хосты, поэтому доступна внутренняя сеть.
- Шаги: allowlist или запрет приватных сетей, лимит сессий на пользователя, вынос в отдельный сервис (см. 3.3).

**CORS и JWT**
- Сейчас CORS ограничен localhost через regex. При деплое задать явный origin.
- Токены живут коротко (access 900 с, refresh 7200 с single_use) — это хорошо, но refresh лежит в `localStorage` (см. 1.2).

---

## 2. Клиент (React / TypeScript / Vite)

### 2.1 TypeScript не компилируется → `npm run build` падает — **высокий**, M
**Факты**
- `tsc --noEmit` [tsc.txt] — 32 ошибки, EXIT 2. Скрипт `build` = `tsc --noEmit && vite build`.
- Примеры:
  - у `AuthFileImage` нет prop `alt`: `CardModal.tsx:778`, `CoverField:78`, `IblockImageField:53`, `RecipeView:87/105`;
  - `createSettingAdapter.ts:81-82`;
  - `CalendarSidebar.tsx:199`;
  - `DeviceImageGallery:36`;
  - `mediaPlayerStore:126`;
  - `TeamStormWorkitemsPage:198`;
  - `propertyValues.ts:84`;
  - ещё 2 тестовых файла.
- `tsconfig.json` исключает из проверки около 14 путей `features/inccom`, то есть реальных ошибок больше.
- Есть обходной `build:ignore` (без tsc).

**Шаги**
1. Исправить 32 ошибки; основная масса — один тип (`alt` в `AuthFileImage`).
2. Поэтапно вернуть исключённые пути inccom в проверку.
3. Добавить `tsc --noEmit` в CI отдельным шагом.

### 2.2 ESLint: 473 проблемы, конфиг частично сломан — **средний**, S
**Факты** [eslint.txt]
- Всего 473 проблемы: 457 errors и 16 warnings; 346 исправляются автоматически.
- Топ правил:

  | Правило | Число |
  |---|---|
  | `curly` | 119 |
  | `dot-notation` | 73 |
  | `method-signature-style` | 60 |
  | `self-closing-comp` | 57 |
  | `no-unused-vars` | 37 |
  | `no-duplicate-imports` | 24 |
  | `no-console` | 16 |

- 7 ошибок «Definition for rule 'react-hooks/exhaustive-deps' was not found»: `eslint-plugin-react-hooks` есть в devDependencies, но не подключён в `eslint.config.js`. Значит, правила хуков (rules-of-hooks, exhaustive-deps) не работают совсем, а на 278 `useEffect` это важно.
- Prettier настроен (`.prettierrc`), но `prettier --check src/**/*.{ts,tsx}` находит 754 неотформатированных файла.

**Шаги**
1. Подключить `reactHooks.configs.recommended` и `eslint --fix`.
2. Отдельным коммитом выполнить `prettier --write` (добавить его в `.git-blame-ignore-revs`).
3. Добавить lint в CI и lint-staged в pre-commit.

### 2.3 Размер бандла и стартовая загрузка — **высокий**, M
**Факты** [build-prod.txt, stats.html]
- `dist/index.html` предзагружает 20 файлов: 2685 КБ raw / 744 КБ gzip.
- Главная проблема — чанк `app-announcement-*.js` весом 1,37 МБ (410 КБ gz). По визуализатору в нём:

  | Библиотека | Размер |
  |---|---|
  | `@mantine/core` | 598 КБ |
  | prosemirror/tiptap | ~450 КБ |
  | zod | 130 КБ |
  | axios | 93 КБ |
  | query-core | 51 КБ |

- Причина в `manualChunks`: общие библиотеки попадают в первый app-чанк, а чанк `mantine` весит всего 23 КБ.
- На старте также предзагружаются app-board, calendar, inccom, device-component, github, main-group и др. Это ленивые приложения, которые тянутся из-за статических импортов.
- `vendor` (react-dom) — 801 КБ.
- 2 предупреждения `INEFFECTIVE_DYNAMIC_IMPORT`: `useAppManager.ts`, `ChildWindowPortal.tsx`.
- Тяжёлые ленивые чанки:

  | Чанк | Размер | Причина |
  |---|---|---|
  | pkb | 938 КБ | cytoscape 816 КБ |
  | pdf viewer | 755 КБ | |
  | office viewer | 688 КБ | mammoth + bluebird/underscore |
  | ssh | 435 КБ | |
  | highlight.js | 256 КБ | полная сборка |
  | leaflet | 237 КБ | |

- PWA прекэширует 136 записей (5307 KiB): весь «зоопарк» скачивается при первом визите.
- `npm run analyze` падает: `stats.html` (3,45 МБ) превышает лимит прекэша workbox 2 MiB.
- `scripts/check-bundle-size.mjs` проверяет только `index-*` (12 КБ) и `mantine-*` (23 КБ), поэтому проходит ложно и пропускает реальный чанк оболочки.

**Шаги**
1. Переписать `manualChunks` функцией по `id`:
   - `node_modules/@mantine` → `mantine`;
   - `@tiptap|prosemirror` → `editor`;
   - `react|react-dom|scheduler` → `react`;
   - zod, axios и query → `core-vendor`.
   
   tiptap должен грузиться только в приложениях с редактором.
2. Найти статические импорты ленивых приложений (реестр приложений и announcement) и заменить их на `lazy()`. Устранить оба `INEFFECTIVE_DYNAMIC_IMPORT`.
3. highlight.js импортировать через `highlight.js/lib/core` с регистрацией нужных языков. cytoscape, pdf, mammoth и leaflet подгружать только при открытии.
4. Workbox:
   - `globIgnores` для тяжёлых чанков, им — runtime caching;
   - в analyze-режиме исключить `stats.html` или отключить PWA.
5. Переписать check-bundle-size: считать сумму gzip по `<link rel=modulepreload>` и `<script>` из `dist/index.html`, бюджет, например, ≤ 300 КБ gz. Запускать в CI.

### 2.4 Неиспользуемые и дублирующиеся зависимости, мёртвый код — **средний**, S–M
**Факты** [knip.txt — требует ручной проверки]
- Неиспользуемые файлы: 120; экспорты: 140; типы: 135; дублирующиеся экспорты: 15.
- Неиспользуемые зависимости:
  - `@tanstack/query-db-collection`, `@tanstack/react-db`, `react-query-devtools`, `react-table`;
  - `@types/cytoscape` — лежит в dependencies;
  - `@yudiel/react-qr-scanner`, `clsx`, `embla-carousel(-react)`, `recharts`.
- Неуказанная зависимость: `@tiptap/core`.
- 35 пакетов в нескольких версиях: vite 8.1.4 и 7.3.6, @tanstack/db 0.9.2 и 0.7.0. `node_modules` весит 760 МБ.
- В корне лежит пустой `package-lock.json`-заглушка.
- depcheck не отработал (пустой вывод), поэтому опирались на knip.

**Шаги**
1. Проверить список knip вручную, удалить лишнее и добавить `@tiptap/core` явно.
2. Перенести `@types/*` в devDependencies.
3. Удалить корневой lock и выполнить `npm dedupe`.
4. Добавить `knip` в CI в режиме отчёта.

### 2.5 Дублирование кода и крупные файлы — **средний**, L
**Факты**
- `components/table` (9664 строки) и `features/inccom/shared/ui/table` (8790 строк) — почти копии; это признаётся в `MIGRATION.md`.
  - `TableData.tsx`: 1026 и 1060 строк, расхождение 225 строк.
  - `group-by.ts`: 841 и 816 строк.
- Крупные файлы:

  | Файл | Строк |
  |---|---|
  | `CardModal.tsx` | 1091 |
  | `boardApi.ts` | 894 |
  | `IblockPropertyApp` | 862 |
  | `IblockElementApp` | 847 |
  | `Window.tsx` | 843 |
  | `NoteEditorPanel` | 835 |
  | `TaskbarClock` | 523 |

- `features/inccom` весит 2,0 МБ исходников.

**Шаги**
1. Оставить одну реализацию таблицы (`components/table`), перенести отличия inccom через props или slots и удалить копию.
2. Разбить `CardModal`, `Window` и `boardApi` на подкомпоненты и хуки (по доменам: comments, attachments, checklist…).
3. Ввести порог `max-lines` (например, 500) как warning.

### 2.6 Качество кода: типы, эффекты, ошибки, утечки — **средний**, M
**Факты**
- Типобезопасность:
  - около 63 `any`;
  - 9 директив `ts-ignore` и `eslint-disable`.
- Хуки и мемоизация:
  - 278 `useEffect`, 412 `useMemo`;
  - всего 25 `memo` и 3 `useShallow` на Zustand. Высока вероятность лишних ререндеров при подписке на весь store, но профилирование не проводилось — это статическая эвристика.
- Обработка ошибок:
  - 8 мест `.catch(() => {})`, где ошибки глотаются молча;
  - `queryClient.ts` глобально ставит `staleTime: Infinity` и `retry: false`: данные никогда не обновляются сами, а временные сетевые сбои сразу становятся ошибками.
- Утечки — window-listener без снятия:
  - `core/api/offlineOutbox.ts:295` (`'online'`);
  - `features/inccom/.../store-auth.ts:115` (на уровне модуля, мелко).
- Хорошее: есть `WindowErrorBoundary.tsx` на уровне окна.

**Шаги**
1. Для `queryClient` задать разумные дефолты: `staleTime` 30–60 с, `retry: 1–2` для GET, `Infinity` — точечно.
2. Заменить пустые catch на логирование или нотификацию.
3. Для Zustand использовать селекторы с `useShallow`, затем профилировать React DevTools Profiler (оконный менеджер, Taskbar, Board).
4. Постепенно убирать `any`: включить `@typescript-eslint/no-explicit-any` как warn.

### 2.7 Доступность (a11y) — **низкий**, M
**Факты**
- tsc-ошибки показывают, что `alt` пытаются передать, а компонент `AuthFileImage` его не поддерживает. Картинки фактически без alt.
- Полный a11y-аудит (axe) не проводился.

**Шаги**
1. Добавить `alt` в `AuthFileImage`.
2. Подключить `eslint-plugin-jsx-a11y`.
3. Прогнать `@axe-core/playwright` в e2e.

---

## 3. Сервер (Symfony / Doctrine)

### 3.1 PHPUnit: 43 из 249 тестов падают — **высокий**, M
**Факты** [phpunit.txt; PHP 8.4 static + pdo_sqlite, ~21 с]
- Итог: 249 тестов, 32 errors, 11 failures, 34 deprecations.
- Errors:
  - «table … already exists» при `SchemaTool` в `ExplorerApiTest` (15) и `MainOuApiTest` (5) — это проблема изоляции тестов;
  - `SchoolTaskApiTest` (13) импортирует несуществующий `SchoolTask\Entity\StGroup`.
  
  Все они падают и при изолированном запуске.
- Failures:
  - `BoardFilterApiTest`: 400 «Unexpected value for parameter assignee: expecting array, got string» — тест и контроллер разошлись;
  - Calendar и DualAuth: 401 «Нет доступа к приложению «Календарь»»;
  - ожидается 403, фактически 401 (Explorer/SchoolTask `requiresAuthentication`);
  - `MainUserApiTest`: 403;
  - Pkb: расхождение счётчика в `LinkIndexService`; в `PkbManagerTest` нет таблицы `pkb_vault_member`.
- `TEST_REPORT.md` (06.08.2026) заявляет PASS, но команды в нём используют `/c/OSPanel/modules/PHP-8.3/php.exe`. Документ устарел.
- `server/.phpunit.cache/test-results` закоммичен и меняется при каждом прогоне.

**Шаги**
1. Общий `KernelTestCase`-трейт: `dropSchema` + `createSchema` (или dama/doctrine-test-bundle с транзакциями).
2. Исправить импорт `StGroup` и тест фильтра `assignee[]`.
3. Выдать тестовым пользователям доступ к приложениям в фикстурах.
4. Унифицировать 401/403 и прогонять тесты на MySQL в CI (service container).
5. Убрать `.phpunit.cache` из git.

### 3.2 Статический анализ (phpstan): реальные баги — **высокий**, M
**Факты** [phpstan-l5.txt, phpstan-l8.txt]
- Уровень 5 — 478 ошибок; уровень 8 — 1846.
- По модулям: Device 198, Main 74, IBlock 47, IncCom 45, Board 27, SchoolTask 21.
- Реальные дефекты:
  - `DeviceManager.php:268` вызывает несуществующий `Property::setDefault()`;
  - `ApiAccountController.php:112` вызывает `upgradePassword` у базового `EntityRepository`;
  - `ApiLoginController.php:55` вызывает `getEmail()` у `UserInterface`;
  - в `License.php:302` `$errors` может быть не определён;
  - `SoftwareController:151/167` и `SoftwareTypeController:103/115` передают аргумент неверного типа;
  - `@extends` в Device-репозиториях указывает на класс OU;
  - сущности обращаются к репозиториям (matching/count) изнутри;
  - мёртвый код в `AbstractManager.php:52-61`;
  - 41 implicitly-nullable параметр (deprecation в PHP 8.4).
- Null-разыменования после `find()`: Device `TypeController:274`, `SubDeviceController:186`.
- phpstan-doctrine упал (`ProxyFactory proxyDir null`) и был отключён. psalm не запускался.

**Шаги**
1. Добавить phpstan в `require-dev` и `phpstan.neon` в репозиторий с уровнем 5 и baseline.
2. Исправить перечисленные баги, затем постепенно поднимать уровень.
3. Внедрить rector для `?Type` nullable и PHP 8.4.

### 3.3 Долгоживущие воркеры: SSE и SSH — **средний**, M–L
**Факты**
- `BoardController.php:179-232` (SSE) держит PHP-воркер 55–120 с и каждые 1,5 с опрашивает БД (`getBoard` + `getBoardChanges`).
- `CardRepository.php:156` фильтрует по `c.updatedAt > :since`, но индекса по `board_card.updated_at` нет.
- `SshStream` вызывает `set_time_limit(0)`: воркер занят на всё время сессии, обмен идёт через файлы.
- При php-fpm с `pm.max_children` порядка 10–20 несколько открытых досок или терминалов исчерпают пул.

**Шаги**
1. Добавить индекс `(board_id, updated_at)` на `board_card`.
2. Перенести realtime на Mercure (штатно для Symfony) или отдельный WS-сервис. До этого — увеличить интервал и заменить вызов `getBoard` дешёвым запросом `MAX(updated_at)`.
3. SSH вынести в отдельный процесс (Node/Go websocket-шлюз) с лимитами.

### 3.4 N+1 и индексы — **средний**, M
**Факты**
- `BoardManager::serializeBoardDetail` (строка 1444) выполняет запрос на каждый список (`findByListOrdered` без join, `CardRepository:23-31`). Ещё по 2 lazy-загрузки на карточку — labels (1874) и assignees (1887). Итого около `1 + L + 2C` запросов: для доски с 10 списками и 200 карточками это примерно 400+.
- Индексы: на 82 сущности 19 `ORM\Index` и 41 `UniqueConstraint`.
- Реальное число запросов не замерялось (анализ статический).

**Шаги**
1. Один запрос карточек доски с `leftJoin` + `addSelect` labels и assignees, группировка в PHP.
2. Добавить тест-счётчик запросов (DebugStack или Doctrine middleware).
3. Пройтись по фильтрам и сортировкам в репозиториях и добавить индексы на FK и поля фильтров.

### 3.5 Пагинация и валидация ввода — **средний**, M
**Факты**
- `App/Http/PageQuery` не используется (0 мест). `PaginationService` есть в 8 файлах (IncCom MAX 100). `setMaxResults` встречается в 39 местах; у списков разный контракт.
- `$request->toArray()` — 177 вызовов. Validator/Assert — 51 файл. `#[MapRequestPayload]` / `#[MapQueryString]` не используются.

**Шаги**
1. Ввести единый DTO запроса списка (page, limit ≤ 100, sort из allowlist) через `#[MapQueryString]`.
2. Для POST/PUT — DTO с Assert через `#[MapRequestPayload]`. Начать с auth, upload и Board.

### 3.6 Обработка ошибок и логирование — **средний**, S
**Факты**
- `ApiExceptionSubscriber` обрабатывает только `ValidationFailedException`. Остальные исключения превращаются в 500 с HTML или стектрейсом, например `InvalidArgumentException` из `UploadPathResolver`.
- `symfony/monolog-bundle` не установлен. `LoggerInterface` используется в 2 файлах (3 вызова). `AuditLog` — в 9 файлах.

**Шаги**
1. Подключить monolog: JSON-логи в stderr, channel security, логирование неуспешных логинов.
2. В subscriber маппить `HttpExceptionInterface`, `AccessDenied` (403), `InvalidArgument` (400) и прочее (500 без деталей в prod) с единым JSON-форматом.

### 3.7 Крупные классы — **низкий**, L
**Факты**

| Класс | Строк |
|---|---|
| `SeedXosProjectCommand` (с вшитым демо-контентом) | 2117 |
| `BoardManager` | 2050 |
| `SchoolTaskManager` | 1926 |
| `ElementManager` | 1434 |
| `DeviceManager` | 1135 |
| сущность `Device.php` | 963 |

**Шаги**
1. Вынести демо-данные в JSON/YAML-фикстуры.
2. Делить менеджеры по use-case (Serializer, Query, Command-сервисы).

---

## 4. База данных и миграции — **высокий**, M
**Факты**
- 36 миграций без baseline.
- Первая, `Version20260806090000`, делает `ALTER main_claimant` и падает на чистой БД.
- В миграциях 39 `CREATE TABLE` против 83 замапленных сущностей: схема поднимается только через `schema:update`.
- `server/update` запускает `make:migration` во время установки: схема генерируется на машине пользователя.
- `doctrine:schema:validate` — mapping OK; синхронизация с реальной MySQL не проверялась.

**Шаги**
1. Сгенерировать baseline-миграцию полной схемы (`doctrine:migrations:dump-schema`) и отметить существующие миграции как выполненные на проде (`migrations:version --add --all`).
2. Убрать `make:migration` из скриптов установки.
3. В CI: чистая MySQL → `migrations:migrate` → `schema:validate`, ошибка при расхождении.

---

## 5. DevOps / CI

### 5.1 CI красный и неполный — **высокий**, S
**Факты** (GitHub Actions)
- Последние 10 запусков на `master` упали; последний — run 40928296689, `fe33971`, 29.10.2026.
- Job server падает на «Install Composer dependencies»: нет `.env`, `post-install` auto-scripts (`cache:clear`) падают. Воспроизведено локально.
- Job client падает на «Run Vitest».
- CI не запускает lint, tsc и Playwright; нет кэша composer; JWT-ключи не генерируются.

**Шаги**
1. В job server: `cp .env.example .env` (или `APP_ENV=test` с закоммиченным `.env.test` без секретов), затем `lexik:jwt:generate-keypair`. Добавить кэш composer (`actions/cache` по `composer.lock`).
2. Шаги в CI:

   | Job | Шаги |
   |---|---|
   | client | `npm ci` → `lint` → `tsc` → `vitest --coverage` → `build` → `check-bundle-size` |
   | server | `composer validate` → `audit` → `phpstan` → `phpunit` (MySQL service) |

3. Отдельный job e2e: Playwright с поднятым backend. Сделать CI обязательным для merge (branch protection).

### 5.2 Docker и портируемость — **средний**, M
**Факты**
- `Dockerfile` на `node:22` делает `npm i` в `server/` и `CMD node index.js`. Сервер на PHP, поэтому образ нерабочий.
- `.dockerignore` содержит только `**/node_modules`: в контекст попадут `.git` (136 МБ), `.env*` и ключи.
- docker-compose нет.
- Окружение заточено под Windows: OSPanel-пути в `TEST_REPORT.md`, `symfony.exe` (15 МБ) в репозитории, локальный путь `C:\Users\Drozdi\...` в закоммиченных `client/test-results/*/error-context.md`.

**Шаги**
1. Многостадийный Dockerfile: node-стадия собирает `client/dist`, php-fpm 8.4 (alpine) + nginx или FrankenPHP отдаёт `server/public` и статику.
2. Добавить `docker-compose.yml`: app, mysql 8, (mercure).
3. Расширить `.dockerignore`: `.git`, `**/.env*`, `server/var`, `server/config/jwt`, `client/test-results`.
4. Удалить `symfony.exe`; в README предложить Symfony CLI.

### 5.3 Pre-commit и форматирование — **низкий**, S
**Факты**
- `.husky` нет, lint-staged нет.
- Prettier в devDependencies, но 754 файла не отформатированы.
- `.editorconfig` есть (tabs, LF); 1943 файла с LF — переносы строк консистентны.

**Шаги**
1. Добавить husky + lint-staged с `eslint --fix`, `prettier --write`, `php-cs-fixer` и gitleaks.

---

## 6. Тесты (клиент) — **высокий** (починка), **средний** (покрытие), M–L
**Факты** [vitest.txt, playwright.txt]
- Vitest: 4 из 69 файлов и 10 из 414 тестов падают.
  - `sessionRestore` ×3: «ReferenceError: localStorage is not defined» — в `vite.config` задан `environment: 'node'`.
  - `coreScopes`, `deviceAccess`, `mainAccess` ×5: ожидания по ролям `*_ROOT` (полный доступ) не совпадают с кодом. Это либо регрессия логики доступа, либо устаревшие тесты; нужно разбирать.
- `test.include` охватывает только `src/**/*.test.ts`, поэтому 6 файлов `*.test.tsx` (компонентные) не запускаются. При этом они импортируют неустановленные `@testing-library/react` и `user-event` и неразрешимый `#dev/vitest/render`.
- Покрытие: строки и операторы 7,58 % (6351/83758), функции 30,08 %, ветки 54,72 %.
- Playwright (5 spec; прогнан локально без backend, браузер скачан):

  | Результат | Число |
  |---|---|
  | passed | 3 |
  | failed | 2 |
  | skipped | 3 (требуют `E2E_INTEGRATION=true` и сервер) |

  - Падают `calculator-loop.spec.ts` и `theme-switch.spec.ts`: при замоканном API кнопка «Пуск» не появляется за 15 с. Вероятно, моки (`/api/login-check`, `/api/user`, фейковый не-JWT токен) устарели относительно текущего auth-флоу; точную причину не устанавливал.
  - Закоммиченные `client/test-results/.last-run.json` показывают, что автор не смог запустить e2e: браузер не установлен.

**Шаги**
1. Для тестов с DOM и storage: `// @vitest-environment happy-dom` или `environmentMatchGlobs`.
2. Разобрать 7 тестов доступа вместе с серверной логикой ролей.
3. Добавить `src/**/*.test.tsx` в include, установить `@testing-library/react` и `user-event`, создать `#dev/vitest/render` (обёртка MantineProvider + QueryClient).
4. Обновить моки e2e. Удалить `client/test-results/` из git и добавить в `.gitignore`.
5. Цели покрытия: auth, api-клиент, offlineOutbox, оконный менеджер. Порог в CI начать с текущего (7 %) и поднимать.

---

## 7. Документация и DX — **средний**, M
**Факты**
- Корневого README нет; `client/README.md` — шаблон Vite.
- В `docs/` 50 md-файлов, но всего 1606 строк (в среднем ~32 строки).
- `DEVELOPER_GUIDE.md`, на который ссылается `.env.test`, отсутствует.
- `TEST_REPORT.md` устарел (см. 3.1).
- Есть `.cursor/agents` (7 промптов), `.cursor/rules/general.mdc` и `.vscode/settings.json`.

**Шаги**
1. Корневой README: что это, архитектура (модули), требования (PHP 8.2+, Node 22, MySQL), запуск за 5 команд (`docker compose up` или вручную), генерация JWT, создание admin, тесты.
2. `docs/DEVELOPER_GUIDE.md`: структура модулей, как добавить приложение, соглашения API, env-переменные (включая все `*_SECRET`).
3. `CONTRIBUTING`: формат коммитов (сейчас 175 из 225 коммитов с пустым сообщением или «-»), ветки, PR.

---

## 8. Гигиена репозитория — **средний**, S
**Факты**
- Закоммичены:
  - `server/.env.dev` (с прод-`APP_SECRET`) и `server/.env.test`;
  - `symfony.exe` (15 МБ, также в истории);
  - `client/test-results/*`;
  - `server/.phpunit.cache/test-results`.
- Корневой `.gitignore` содержит `.env.*`, но env-файлы уже отслеживаются.
- История раздута медиа из `img/` (mp3/mp4 по 7–15 МБ) и `symfony.exe`; `.git` весит 136 МБ.
- OPENSSH-ключи в истории — фейковые фикстуры тестов, это нормально.

**Шаги**
1. `git rm --cached` для перечисленных файлов. В репозитории оставить только `.env` с безопасными дефолтами и `.env.test` без секретов (практика Symfony), локальные значения держать в `.env.local`.
2. Медиа перенести в Git LFS или внешнее хранилище.
3. Вместе с пунктом 1.1 — одна чистка истории через `git filter-repo`.

---

## 9. Дорожная карта

### Фаза 1 — быстрые победы (1 неделя)
| # | Задача | Приоритет | Объём |
|---|---|---|---|
| 1 | Ротация пароля БД, `APP_SECRET`, JWT passphrase; перешифровка SSH-секретов (1.1) | критично | S |
| 2 | Убрать `allow-same-origin` в BrowserApp, добавить CSP на прокси (1.2) | критично | S |
| 3 | DQL-инъекции: удалить переопределение `fieldVal`, ввести allowlist `sortBy` (1.5) | высокий | S |
| 4 | Rate limiter и `login_throttling` на логины и register (1.7) | высокий | S |
| 5 | Ограничить `/api/main/file/{id}`: проверка доступа и `attachment` + `nosniff` (1.4, частично) | высокий | S |
| 6 | Починить CI: `.env` и JWT в job server, кэш composer (5.1) | высокий | S |
| 7 | Исправить 32 ошибки tsc; подключить react-hooks в ESLint, `eslint --fix` (2.1, 2.2) | высокий | S–M |
| 8 | Vitest: happy-dom для sessionRestore, разобрать тесты доступа (6) | высокий | S |
| 9 | `npm audit fix`, `composer update` патчей twig и symfony в рамках 7.3 (1.6, частично) | высокий | S |
| 10 | `git rm --cached` для env, test-results, `.phpunit.cache`, `symfony.exe` (8) | средний | S |

### Фаза 2 — 1 месяц
- SSRF: `NoPrivateNetworkHttpClient`, лимиты размера и редиректов (1.3).
- Загрузки: allowlist, лимиты, случайные имена; IDOR в `FileServeController`; проверка DocumentRoot (1.4).
- Переход на Symfony 7.4 LTS; обновление doctrine/orm, lexik, vitest, axios, tiptap и react-router; Dependabot (1.6).
- PHPUnit в зелёное, изоляция схемы, MySQL в CI (3.1).
- phpstan уровня 5 + baseline в CI; исправить перечисленные баги (3.2).
- Бандл: новые `manualChunks`, ленивые приложения, highlight core, workbox; честный check-bundle-size, цель ≤ 300 КБ gz на старте (2.3).
- Board: устранить N+1, индекс `updated_at`, облегчить SSE-polling (3.3, 3.4).
- Baseline-миграция и `migrate` + `schema:validate` в CI (4).
- Monolog и единый `ApiExceptionSubscriber` (3.6).
- DOMPurify; единый `TokenCipher`, запрет plaintext в prod (1.8).
- Корневой README и DEVELOPER_GUIDE (7); husky + lint-staged + prettier (5.3).
- Рабочий Dockerfile и docker-compose (5.2).

### Фаза 3 — дальше (1–3 месяца)
- Refresh-токен в HttpOnly-cookie, access-токен в памяти (1.2).
- Realtime через Mercure или WebSocket; SSH-шлюз отдельным сервисом (3.3).
- Удалить дубль таблицы inccom; разбить крупные компоненты и менеджеры (2.5, 3.7).
- DTO + `MapRequestPayload` и единая пагинация по всем API (3.5).
- Покрытие: компонентные тесты, e2e в CI с backend, axe-проверки a11y (6, 2.7).
- Профилирование ререндеров, селекторы Zustand, дефолты Query (2.6).
- phpstan уровня 8; удалить мёртвый код по knip (2.4, 3.2).
- Чистка git-истории (медиа в LFS); переход на Symfony 8.x.

---

## 10. Что не удалось проверить

| Проверка | Почему не выполнена |
|---|---|
| PHPUnit на MySQL, синхронизация схемы с реальной БД | Тесты гонялись на SQLite: apt-зеркало Debian недоступно (500 / SSL EOF), MySQL не ставился; PHP — статическая сборка static-php-cli |
| Интеграционные e2e (3 skipped) | Нужен поднятый backend с тестовым пользователем; прогнаны только неинтеграционные |
| phpstan-doctrine | Падает с ошибкой `ProxyFactory proxyDir null` |
| psalm | Не запускался |
| depcheck | Пустой вывод; использован knip |
| Реальные ререндеры и утечки памяти | Только статические эвристики, без профилирования в браузере |
| Фактическое число SQL-запросов (N+1) | Оценка по коду, без замеров |
| Конфигурация прод-сервера (DocumentRoot, php-fpm, HTTPS, заголовки) | Недоступна |
| Использует ли прод до сих пор утёкшие пароль БД и `APP_SECRET` | Подключение к чужой БД намеренно не выполнялось |
| Полный a11y-аудит (axe) | Не проводился |
