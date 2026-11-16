# XOS — план приложения «RDP» (подключение к Windows)

Изучен коммит `7070dbf` репозитория https://github.com/drozdi/xos (только чтение).

**Вводные (ред. 2):** у пользователя есть Windows-машины **и в интернете, и во внутренних сетях (LAN/VPN)**. План учитывает обе зоны: публичные адреса проверяются как сейчас (`PublicHost`), внутренние разрешены только в подсетях из админского allowlist; доступ к LAN — через локальный guacd (MVP) или через удалённые guacd-узлы (позже).

Предыдущая версия плана: `/workspace/xos-rdp-plan.v1.md`.

## 1. Что такое XOS

Веб-«рабочий стол» в браузере: окна, панель задач, меню «Пуск».

- **Клиент** `client/`: React 19 + TypeScript, Vite 8, Mantine 9 (UI), TanStack Query, zustand, zod, react-rnd (окна), xterm.js (терминал), Tailwind 4, Vitest/Playwright.
- **Сервер** `server/`: Symfony 7.4 (PHP 8.4), Doctrine + MySQL 8, JWT (lexik) + refresh в HttpOnly-cookie, Mercure для realtime.
- **Модули сервера**: `server/src/<Module>/` (Entity, Repository, Service, Controller, `config/{services,routes}.yaml`, `config/packages/doctrine.yaml`, `setting.json` с ролями-claimant). Подключаются глобом: `server/config/services.yaml` → `../src/*/config/services.yaml`.
- **Приложения клиента**: `client/src/apps/<id>/index.ts` экспортирует `AppManifest` (`client/src/core/appManager/types.ts`); автообнаружение через `import.meta.glob('../../apps/*/index.ts')` в `client/src/core/appManager/registerApps.ts`. Окно — `React.lazy`. Общая логика — `client/src/features/<domain>`, API — `client/src/core/api/endpoints/*.ts` (axios + zod).
- **Сборка/деплой**: `Dockerfile` (node → composer → php:8.4-apache), `docker-compose.yml`: `app`, `mysql`, `mercure`, `ssh-gateway`.
- **Документация**: на домен `docs/<domain>/{README,TZ,API}.md`, индекс `docs/README.md`.

### Уже есть «удалённые» приложения (основа для RDP)
- `apps/ssh` + `server/src/Ssh` + `ssh-gateway/index.mjs` (Node, `ws` + `ssh2`). Схема: браузер с JWT → `POST /api/ssh/gateway/ticket` → одноразовый билет (30 с, кэш `cache.app`, лимит 3 сессии) → WebSocket в шлюз → шлюз `POST /api/ssh/gateway/redeem` с `X-Gateway-Secret` получает расшифрованные параметры **одного** подключения → по закрытию `release`. Браузер никогда не видит пароль и не задаёт хост шлюзу.
- `SshSecretCipher` — AES-256-GCM (`enc:v1:`), ключ `SSH_SECRET_KEY`, команда перешифровки.
- `apps/vnc` («Стол») + `server/src/Ops` (`OpsLink` с `kind`, `VncController` → `VncClient.php`): VNC на PHP, кадр PNG на каждый клик/клавишу. Это опрос, а не поток — для RDP такой подход не годится.
- `features/ops/OpsScreen.tsx` — шаблон «список подключений слева + редактор в модалке + рабочая область».
- `Ops/Service/PublicHost.php` — запрет приватных адресов (защита от SSRF).

## 2. Варианты архитектуры RDP

| Вариант | Суть | Плюсы | Минусы |
|---|---|---|---|
| **A. Apache Guacamole: `guacd` + `guacamole-common-js`** | Контейнер `guacamole/guacd` (FreeRDP внутри), тонкий Node-шлюз WS↔TCP 4822 (свой или `guacamole-lite`), в браузере `Guacamole.Client` рисует canvas | Зрелый, NLA/TLS/RDP-security, буфер обмена, аудио, файлы (RDPDR), запись сессий, динамическое разрешение; Apache-2.0; ложится на имеющийся паттерн билетов | Ещё один контейнер (C), протокол Guacamole, нет TS-типов (нужен `.d.ts`) |
| B. IronRDP WASM + RDCleanPath-прокси | RDP-клиент на Rust в браузере, прокси (Devolutions Gateway) только туннелирует TLS | Меньше серверной нагрузки, современный стек | Молодой проект, сложнее сборка (wasm в Vite), меньше фич (clipboard/звук частично), CredSSP в браузере |
| C. Свой шлюз на FreeRDP (node-биндинги / sidecar) + WebSocket JPEG/H.264 | Полный контроль | Месяцы работы, кодеки, ввод, буфер — всё самим |
| D. Расширить PHP-подход как у VNC | — | Неприемлемо: RDP требует постоянной TLS/CredSSP-сессии и потока |

**Рекомендация: A (guacd + guacamole-common-js) через новый `rdp-gateway` по образцу `ssh-gateway`.** Минимум собственного протокольного кода, все требуемые опции (NLA/TLS, clipboard, resize, fullscreen) есть «из коробки», схема безопасности уже отлажена в SSH-модуле. Позже guacd же даст VNC/SSH «по-настоящему» (можно перевести `apps/vnc` на поток).

## 3. Что добавить в репозиторий

### Сервер — новый модуль `server/src/Rdp/`
(отдельный модуль, а не `kind: 'rdp'` в `OpsLink`: у RDP много специфичных полей — домен, security, опции; `OpsLink` и так перегружен колонками db/tunnel)
- `setting.json` — `{ "name": "RDP", "claimant": { "rdp": "RDP" } }` → `ROLE_RDP` (после `main:claimant:sync`).
- `Entity/RdpConnection.php`: `user`, `name`, `host`, `port`(3389), `zone` (`auto|public|internal`, см. §3.3), `zone_detected` (что вычислил сервер), `network_id` (FK на `RdpNetwork`, nullable — для internal: в какую подсеть попал хост), `node_id` (FK на `RdpNode`, nullable, вычисляется; задел под вариант B), `username`, `domain`, `secret` (шифр), `security` (`any|nla|tls|rdp`), `ignore_cert`, `cert_fingerprint` (TOFU), `width/height/dpi` или `resize: display-update|reconnect`, `color_depth`, `enable_clipboard`, `enable_audio`, `enable_drive`, `keyboard_layout`, `gateway_*` (RD Gateway, позже), `created_at/updated_at`.
- `Repository/RdpConnectionRepository.php` (`findForUser`, `findOneForUser`).
- `Service/RdpConnectionPayload.php` (валидация полей по образцу `OpsLinkPayload`; хост — через `RdpHostPolicy`, см. §3.1), `RdpConnectionManager.php` (CRUD, секрет не отдаётся, пустой `secret` не затирает), `RdpGatewayTicketService.php` (копия логики `SshGatewayTicketService`: билет 30 с, лимит сессий, `redeem`/`release`, `hash_equals` секрета).
- Шифрование: переиспользовать `Ssh\Service\SshSecretCipher` (как это делает `OpsLinkManager`) — либо вынести в общий `App\Service\SecretCipher` и отдельный `RDP_SECRET_KEY` + команда `rdp:reencrypt-secrets`.
- `Controller/RdpConnectionController.php` (`GET/POST/PUT/DELETE /api/rdp/connections`, `#[Access('rdp', checkScopes: false)]`), `Controller/RdpGatewayController.php` (`/api/rdp/gateway/{ticket,redeem,release}`).
- `config/services.yaml`, `config/routes.yaml`, `config/packages/doctrine.yaml` — как в `Ssh/`, `Ops/`.
- Миграция `server/migrations/Version2026111xxxxxxx.php` (таблица `rdp_connection`).
- Тесты `server/tests/Rdp/...` (билет одноразовый, чужое подключение → 404, без секрета → 403, валидация хоста; политика сетей: публичный IP ок, приватный вне allowlist → 400/403, приватный в подсети своей группы ок, чужой группы — нет; DNS-имя, сменившее адрес между сохранением и redeem, → отказ; IPv6, IPv4-mapped IPv6, `0.0.0.0`, `127.0.0.0/8`, link-local `169.254.0.0/16` — всегда запрещены).

### Шлюз — `rdp-gateway/` (Node 22, рядом с `ssh-gateway/`)
- `index.mjs`: WS-сервер (`ws`, `maxPayload`, `SSH_GATEWAY_ORIGINS`-подобный `RDP_GATEWAY_ORIGINS`, idle-таймаут). Первое сообщение/параметр URL — билет → `redeem` (ответ содержит **уже проверенный IP** `resolved_ip`, исходное имя, `zone` и адрес guacd-узла `node`: `{host, port, tls, ca_fingerprint}`) → открыть TCP (или TLS для удалённого узла) к нужному guacd (в MVP всегда локальный `guacd:4822`), выполнить handshake Guacamole (`select rdp`, `size`, `audio`, `image`, `connect` с `hostname = resolved_ip` (не имя — защита от DNS rebinding), port/username/password/domain/security/ignore-cert/width/height/dpi/resize-method/disable-copy/…), далее проксировать инструкции в обе стороны; по закрытию `release`. Альтернатива — пакет `guacamole-lite`, но со своим колбэком вместо его AES-токена, чтобы сохранить схему «билет → redeem».
- Ограничения: размер сообщений, rate-limit, фиксированный список параметров (браузер присылает только ширину/высоту/DPI, не хост).
- `Dockerfile`, `package.json`.
- `docker-compose.yml`: сервисы `guacd` (`guacamole/guacd`, без публикации порта наружу) и `rdp-gateway` (порт 7682). `.env.docker.example`: `RDP_GATEWAY_SECRET`, `RDP_GATEWAY_PUBLIC_URL`, `RDP_GATEWAY_ORIGINS`, (`RDP_SECRET_KEY`).

### Клиент
- `client/src/apps/rdp/index.ts` — манифест: `id: 'rdp'`, `name: 'Удалённый рабочий стол'`, `icon: RdpIcon`, `defaultSize 1100×720`, `minSize 720×460`, `wmGroup/startMenuGroup/taskbarGroup: 'manage'`, `startMenuSort: 20`, `requiredRole: 'rdp'`, `checkScopes: false`, `canAccess: canUseRdp`, `singleInstance: false` + `instanceKey` по `connectionId` (несколько сессий в разных окнах).
- `RdpIcon.tsx` (через `features/ops/ToolIcon`), `RdpApp.tsx` (список на базе `OpsScreen`-подобного компонента или обобщить `OpsScreen` под произвольный API; у каждого подключения бейдж зоны Mantine `Badge`: «Интернет» / «Внутренняя · <имя сети>», красный «Нет доступа», если подсеть отозвана или узел недоступен), `RdpEditor.tsx` (форма Mantine + zod), `RdpSession.tsx` (canvas Guacamole, клавиатура/мышь/тач, resize через `ResizeObserver` → `client.sendSize`, полноэкранный режим через Fullscreen API, панель: Ctrl+Alt+Del, буфер обмена, переподключение, отключение, статус/ошибки).
- `client/src/features/rdp/rdpAccess.ts` (`canUseAppModule('rdp')`), `guacamole.d.ts`.
- `client/src/core/api/endpoints/rdpApi.ts` (zod-схемы, `list/create/update/remove/gatewayTicket`), ключи в `core/api/queryKeys.ts`.
- Зависимость `guacamole-common-js` (npm) — грузить лениво внутри `RdpSession`, учесть `scripts/check-bundle-size.mjs`.

### Форма подключения
Название · Хост · Порт (3389) · Зона (Авто / Интернет / Внутренняя — «Авто» по умолчанию; после ввода хоста сервер подсказывает зону и сеть через `POST /api/rdp/connections/check-host`) · Пользователь · Домен · Пароль («оставьте пустым, чтобы не менять») · Безопасность (Авто / NLA / TLS / RDP) · Игнорировать сертификат (с предупреждением) · Разрешение: «по окну» / фиксированное (1280×720, 1920×1080…) / DPI · Глубина цвета · Буфер обмена (вкл/выкл, направление) · Звук · Раскладка клавиатуры · (позже) диск, принтер, RD Gateway, запуск программы (RemoteApp).

### Документация
`docs/rdp/{README,TZ,API}.md`, строка в `docs/README.md`, переменные в `README.md` и `docs/DEVELOPER_GUIDE.md`.

### 3.1. Политика сетей: публичные и внутренние адреса

**Правило.** Публичный адрес — разрешён, как сейчас в `Ops/Service/PublicHost.php`. Приватный/внутренний (RFC1918 `10/8`, `172.16/12`, `192.168/16`, CGNAT `100.64/10`, IPv6 ULA `fc00::/7`, имена `*.local`/`*.internal`/корпоративный суффикс) — **только если адрес попадает в подсеть из allowlist, назначенную группе или роли пользователя**. Всегда запрещены: `127.0.0.0/8`, `::1`, `0.0.0.0`, link-local `169.254/16` и `fe80::/10` (включая metadata `169.254.169.254`), multicast/broadcast, адреса самого xos/guacd/MySQL/Mercure (список `RDP_DENY_CIDRS`). IPv4-mapped IPv6 (`::ffff:10.0.0.5`) нормализуется до IPv4 перед проверкой.

**Сущности (модуль `server/src/Rdp/`):**
- `Entity/RdpNetwork.php` — `name`, `cidrs` (список CIDR, IPv4/IPv6; либо отдельная `RdpNetworkCidr` с колонками `network_bin`/`prefix` для индексации), `dns_suffixes` (необяз., напр. `corp.example.local`), `node` (FK на `RdpNode`, null = локальный guacd), `active`, `description`, `created_by`, timestamps.
- `Entity/RdpNetworkGrant.php` — кому сеть доступна: `network` + **`group`** (FK `Main\Entity\Group`) **или** `role` (строка, напр. `ROLE_RDP_LAN`); уникальность пары. Так сеть назначается и через админку групп (`apps/main-group`), и ролью из `setting.json` (`claimant`: `rdp`, `rdp_lan`).
- `Service/CidrMatcher.php` — разбор/проверка CIDR (`inet_pton`, сравнение по маске; без внешних библиотек или `symfony/http-foundation` `IpUtils::checkIp`, который уже есть в зависимостях Symfony).
- `Service/RdpHostPolicy.php` — единая точка: `classify(host): {zone, ips[]}` (резолв A/AAAA через `dns_get_record`, не `gethostbynamel` — нужен IPv6), `assertAllowed(User, host, declaredZone): {zone, resolved_ip, network, node}`. Внутри переиспользует логику `PublicHost` (лучше вынести общий `App\Service\NetworkGuard` и перевести на него и `PublicHost`, и `SshConnectionPayload`, чтобы SSH/VNC позже получили тот же allowlist).
- `Repository/RdpNetworkRepository.php` — `findGrantedForUser(User)`: сети по группам пользователя (`Main\Entity\Group`, см. `apps/main-group/GroupUsersTab.tsx`) и его ролям.

**Когда проверяем.**
1. **При сохранении** (`POST/PUT /api/rdp/connections`): `assertAllowed`; сохраняем `zone_detected`, `network_id`. Если пользователь выбрал зону вручную и она расходится с вычисленной — 400 «Хост 10.1.2.3 относится к внутренней сети, а выбрано „Интернет“».
2. **При выдаче билета** (`/api/rdp/gateway/ticket`): повторная проверка прав (группу могли отнять, сеть — выключить) → 403 с понятной причиной.
3. **При redeem** (`/api/rdp/gateway/redeem`, вызывает шлюз): **повторный резолв DNS** и повторная проверка всех IP; в ответ отдаём **конкретный проверенный IP** (`resolved_ip`), шлюз подставляет в `connect` именно его. Если имя резолвится в несколько адресов — все должны пройти проверку, используется первый прошедший; смешанные «публичный + приватный» → отказ. Это закрывает DNS rebinding (имя проверили как публичное, а к моменту подключения оно указывает в LAN) и TOCTOU между сохранением и подключением. TLS-сертификат Windows при этом проверяется по исходному имени (`server-name`/TOFU-отпечаток), а не по IP.
4. Шлюз дополнительно держит свою «последнюю линию»: `RDP_GATEWAY_DENY_CIDRS` (loopback, metadata, подсеть docker) — даже если API ошибся.

**API (админ, `#[Access('rdp', ...)]` + `ROLE_RDP_ROOT`/`ROLE_ROOT`):**
| Метод | Путь | Назначение |
|---|---|---|
| GET/POST | `/api/rdp/admin/networks` | Список / создать сеть (имя, CIDR, суффиксы, узел) |
| PUT/DELETE | `/api/rdp/admin/networks/{id}` | Изменить / удалить (при удалении подключения в этой сети помечаются «нет доступа», не удаляются) |
| GET/PUT | `/api/rdp/admin/networks/{id}/grants` | Группы и роли, которым сеть доступна |
| POST | `/api/rdp/connections/check-host` | Для пользователя: `{host}` → `{zone, network, allowed, reason}` (подсказка в форме, без раскрытия чужих сетей) |
| GET | `/api/rdp/networks` | Для пользователя: только доступные ему сети (имя + CIDR) |

Валидация CIDR: запрет слишком широких (`/0`–`/7` для IPv4, `< /32` для IPv6) и пересечений с `RDP_DENY_CIDRS`.

**Админ-UI (клиент):**
- `client/src/apps/rdp-networks/` (список сетей, `requiredRole: 'rdp'` + проверка root) и `client/src/apps/rdp-network/` (карточка: вкладки «Общее» — имя, CIDR (`TagsInput` с валидацией), суффиксы DNS, узел; «Доступ» — группы (селект как в `apps/main-group/GroupAccessTab.tsx`) и роли).
- Альтернатива/дополнение: вкладка «Сети RDP» в карточке группы `apps/main-group` (`GroupRdpTab.tsx`).
- API: `client/src/core/api/endpoints/rdpAdminApi.ts`.

**Аудит.** Через `Main\Service\AuditLogger` (виден в `apps/main-audit`, `GET /api/main/audit/list`): создание/изменение сетей и выдач; каждый билет и redeem — `user`, `connection`, `host`, `resolved_ip`, `zone`, `network`, `node`, результат/причина отказа, длительность сессии (из `release`).

### 3.2. Сетевая достижимость внутренних машин

**Вариант A (MVP): guacd на сервере xos с доступом в LAN.** Контейнер `guacd` в `docker-compose.yml` стоит на хосте, у которого есть маршрут во внутренние сети (сервер в LAN, или на сервере поднят VPN — WireGuard/OpenVPN/IPsec — до офиса). Для docker: `network_mode: host` у guacd либо маршрут из docker-сети в VPN-интерфейс (`iptables`/`ip route`); обязательно egress-фильтр: guacd может ходить только на `3389/tcp` (и порты из подключений) в разрешённые CIDR + публичный интернет. Плюс: один компонент, просто. Минус: сервер xos получает доступ во все сети — повышенные требования к его защите; не работает для разрозненных сетей без общего VPN.

**Вариант B (проектируем сейчас, реализуем позже): удалённые guacd-«агенты».** Небольшой узел (контейнер `guacamole/guacd` + TLS) ставится рядом с каждой внутренней сетью; `rdp-gateway` выбирает узел по подсети.
- `Entity/RdpNode.php` — `name`, `endpoint` (`host:port`), `tls_mode` (`none` только для локального, иначе `tls`/`mtls`), `ca_fingerprint` / клиентский сертификат шлюза (секреты шифруются `SshSecretCipher`/общим шифром), `status` (`up|down|unknown`), `last_seen_at`, `latency_ms`, `version`, `max_sessions`, `active`. Узел `local` создаётся миграцией и соответствует `guacd:4822`.
- Связь: `RdpNetwork.node` → узел, обслуживающий подсеть. Маршрутизация в `RdpHostPolicy`: публичная зона → локальный узел (или настраиваемый «узел по умолчанию»); внутренняя → узел сети, в которую попал `resolved_ip`; при пересечении подсетей — побеждает самый длинный префикс.
- `redeem` возвращает `node` (`endpoint`, `tls`, отпечаток CA) — шлюз не хранит реестр сам, источник правды — API.
- TLS между `rdp-gateway` и удалённым guacd: guacd поддерживает TLS (`-C`/`-K`, `guacd.conf [ssl]`); рекомендуем mTLS через stunnel/sidecar, т.к. guacd не проверяет клиентский сертификат сам. Шлюз пинит отпечаток CA узла.
- Обратное подключение (если узел за NAT): узел сам держит исходящий туннель к шлюзу (WireGuard или WSS-реверс-туннель) — открытый вопрос, решаем при реализации B.
- Health-checks: Symfony-команда `rdp:nodes:check` (по cron/Messenger, раз в 30–60 с) делает TCP/TLS-handshake + `select rdp` и пишет `status/latency`; шлюз дополнительно сообщает об ошибках подключения. Если узел `down` — билет не выдаётся (503 «Узел сети „Офис-2“ недоступен»), бейдж в UI.
- Админ-API/UI: `/api/rdp/admin/nodes` (CRUD, «проверить сейчас»), приложение `client/src/apps/rdp-nodes/`; в карточке сети — выбор узла.
- Задел в MVP: таблица `rdp_node` с единственным `local`, `RdpNetwork.node_id`, поле `node` в ответе `redeem` — чтобы B добавлялся без миграции данных и смены протокола шлюза.

### 3.3. Поле «зона» подключения

- `zone`: `auto` (по умолчанию) → сервер ставит `public` или `internal` по `RdpHostPolicy`; ручной выбор допускается только если совпадает с вычисленным (иначе ошибка — защита от «маскировки»).
- Хранятся `zone` и `zone_detected` + `network_id`; при каждом redeem зона вычисляется заново, расхождение (имя «уехало» в LAN) → отказ и запись в аудит.
- Используется: (1) в проверках прав (`public` — достаточно `ROLE_RDP`; `internal` — нужна выдача сети); (2) в UI — бейджи в списке, фильтр «Интернет / Внутренние», разный дефолт (`security: nla`, без `ignore_cert` для public); (3) в аудите и лимитах (отдельный лимит сессий на internal, опционально запрет буфера обмена/дисков для internal политикой сети — поля `RdpNetwork.allow_clipboard`, `allow_drive`).

## 4. Безопасность
- Пароль только на сервере (AES-GCM), в ответах `has_secret`; в браузер не уходит, шлюз получает его на один билет.
- Опция «не сохранять пароль — спрашивать при подключении»: пароль идёт в `ticket` и живёт только в кэше 30 с.
- `guacd` не публикуется наружу; шлюз за TLS-прокси (`wss://`), проверка Origin, общий секрет шлюз↔API.
- SSRF и доступ в LAN: публичные адреса — через `PublicHost`; внутренние — только из админского allowlist (`RdpNetwork` + `RdpNetworkGrant` по группам/ролям), проверка при сохранении, выдаче билета и redeem; повторный резолв DNS и передача шлюзу **проверенного IP** против DNS rebinding; неизменяемый deny-список (loopback, link-local/metadata, служебные подсети) и в API, и в шлюзе.
- guacd с доступом в LAN — привилегированный компонент: отдельный хост/контейнер, egress-фильтр только на RDP-порты разрешённых CIDR, без доступа к MySQL/Mercure; для удалённых узлов — mTLS и пиннинг CA, узлы не доверяют друг другу.
- Права на сети выдаёт только `ROLE_RDP_ROOT`/`ROLE_ROOT`; все изменения allowlist и узлов — в аудит.
- Сертификат: TOFU-отпечаток (как `SshHostKeyMismatch` в SSH), `ignore-cert` только явно.
- Лимит сессий на пользователя (отдельно для internal), idle-таймаут, аудит в `main-audit` (кто, куда, `resolved_ip`, зона, сеть, узел, когда, сколько), опционально запись сессий guacd (обязательная для выбранных сетей).
- Буфер обмена можно выключить политикой (утечки данных).

## 5. Этапы
1. **MVP — публичные + внутренние через локальный guacd (вариант A), ≈1.5–2 нед. (грубо):**
   модуль `Rdp`: `RdpConnection` (с `zone`), `RdpNetwork`, `RdpNetworkGrant`, `RdpNode` (только `local`), миграция; `RdpHostPolicy` + `CidrMatcher` (проверки при сохранении, ticket и redeem с повторным резолвом, deny-список); CRUD подключений, `check-host`, админ-API сетей; `guacd` + `rdp-gateway` в compose (guacd с маршрутом в LAN/VPN, egress-фильтр); клиент: `apps/rdp` (список с бейджами зон, форма, сессия с фиксированным разрешением, клавиатура/мышь), `apps/rdp-networks` (минимальная админка CIDR + группы); аудит билетов. Тесты PHPUnit (политика сетей — основной набор) + Vitest, docs.
2. **Удобство:** авто-размер (display-update), полноэкранный режим, Ctrl+Alt+Del и спецклавиши, текстовый буфер обмена (с учётом политики сети), переподключение, несколько окон, понятные ошибки (NLA, сертификат, таймаут, «сеть не разрешена», «узел недоступен»).
3. **Расширения:** звук, файлы (виртуальный диск + `explorer`), TOFU сертификата, «спрашивать пароль», RD Gateway, RemoteApp, тач/мобильная клавиатура; вкладка «Сети RDP» в `apps/main-group`.
4. **Удалённые guacd-узлы (вариант B):** CRUD `RdpNode`, mTLS шлюз↔узел, маршрутизация по подсети (longest prefix), health-checks `rdp:nodes:check`, статусы в UI, образ/инструкция для установки узла, (опц.) обратный туннель для узлов за NAT.
5. **Админ/безопасность:** запись сессий по политике сети, отдельные лимиты, общие подключения для групп, перевод SSH/VNC/DB на общий `NetworkGuard` и allowlist; (опц.) `apps/vnc` на guacd.

## 6. Риски и открытые вопросы
- Обе зоны есть (интернет + LAN/VPN). Открыто: какие именно подсети и сколько площадок; есть ли у сервера xos маршрут в них (сервер в LAN или нужен VPN) — от этого зависит, хватит ли варианта A или сразу нужен B.
- Пересекающиеся подсети на разных площадках (две `192.168.1.0/24`) — longest prefix не поможет; в варианте B понадобится явная привязка подключения к сети/узлу.
- DNS: внутренние имена резолвит ли сервер xos (split-horizon DNS, VPN-резолвер)? В варианте B имя должно резолвиться на стороне узла — тогда redeem проверяет имя через узел или требует IP/суффикс сети.
- Назначать сети группам (`Main\Entity\Group`) или ролям — или и то, и другое? Нужна ли иерархия групп (наследование выдач от `parent`)?
- Риск компрометации: guacd/сервер с доступом в LAN становится точкой входа во внутреннюю сеть — нужны изоляция, egress-фильтр, обновления FreeRDP.
- `PublicHost` использует `gethostbynamel` (только IPv4) — для RDP нужен резолв A+AAAA; при выносе в общий `NetworkGuard` поведение SSH/VNC изменится — нужны регрессионные тесты.
- Хостинг: сколько одновременных сессий (guacd ~50–150 МБ RAM и CPU на сессию), есть ли Docker в проде (сейчас Apache + PHP, шлюзы — отдельные процессы).
- Хранить пароль или спрашивать каждый раз? Нужны ли общие подключения?
- Роль: новая `ROLE_RDP` (+ `ROLE_RDP_ROOT` для админки сетей) или переиспользовать `ssh` (как `vnc`/`docker`/`tunnel`)?
- Нужен ли RD Gateway / смарт-карты / Azure AD (NLA с AAD guacd не поддерживает).
- Горячие клавиши браузера (Win, Alt+Tab, Ctrl+W) перехватываются браузером — частично решается Keyboard Lock API в fullscreen.
- `guacamole-common-js` без типов и не ESM-first — проверить совместимость с Vite 8.
- Совместимость версий FreeRDP в образе guacd с новыми Windows (NLA/CredSSP, TLS 1.3).
