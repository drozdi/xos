# Разработка

## Требования

- PHP 8.4
- Node.js 22
- MySQL 8

В OSPanel PHP: `C:\OSPanel\modules\PHP-8.4\php.exe`.

## Сервер

```
cd server
composer install
cp .env.example .env
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:execute "DoctrineMigrations\\Version20260801000000" --up
php bin/console doctrine:migrations:version --add --all
php bin/console doctrine:migrations:migrate
php bin/console main:claimant:sync
```

`DATABASE_URL` указывает на MySQL. Тесты берут SQLite из `.env.test` и не ходят в рабочую базу.

Пустая база собирается baseline-миграцией, после чего старые миграции отмечаются выполненными: схема уже полная. На рабочей базе, где таблицы есть, baseline пропускается. `version --add --all` там не запускайте, если ещё не применены нужные миграции.

Первый администратор создаётся через существующую команду пользователя или регистрацию, если она открыта в этом окружении. Роль `ROLE_ROOT` даёт полный доступ.

Проверка:

```
cd server
php bin/console doctrine:schema:validate
vendor/bin/phpunit
vendor/bin/phpstan analyse
```

## Клиент

```
cd client
npm ci
npm run dev
```

Прокси Vite отправляет `/api` и `/uploads` на `http://localhost:8000`.

```
npm test
npx tsc --noEmit
npm run build
node scripts/check-bundle-size.mjs
```

## DocumentRoot

Прод и Docker отдают `server/public`. В этот каталог попадают `index.php` и собранные `index.html` со статикой. Запросы `/api` и `/uploads` уходят в `index.php`. Остальное — клиент.

Корневой `.htaccess` нужен только если DocumentRoot временно указывает на корень репозитория. Он не отдаёт произвольные файлы проекта.

## Секреты

В prod пустой ключ шифрования — ошибка, plaintext не пишется.

- `APP_SECRET` — ядро Symfony
- `SSH_SECRET_KEY` — SSH. Перешифровка: `php bin/console ssh:reencrypt-secrets` (не запускать, пока ключ не задан)
- `INCCOM_FNS_SECRET`, `TS_TOKEN_SECRET`, `GITHUB_TOKEN_SECRET` — токены модулей. Перешифровка: `php bin/console app:reencrypt-token-secrets`
- `YANDEX_DISK_TOKEN_SECRET`, `PKB_AT_REST_SECRET` — Яндекс.Диск и тела заметок PKB

JWT-ключи лежат в `server/config/jwt` и не коммитятся. Пароль: `JWT_PASSPHRASE`.

Refresh-токен приходит в HttpOnly-cookie (`xos_refresh` или `xos_app_refresh`). Access-токен остаётся только в памяти страницы. Запрос `/api/token/refresh` идёт с cookie, без тела.

Доска: `MERCURE_URL` для публикации, `MERCURE_PUBLIC_URL` для браузера. Без hub клиент остаётся на SSE.

SSH-шлюз: `ssh-gateway` (`node index.mjs`), секрет `SSH_GATEWAY_SECRET`, публичный адрес `SSH_GATEWAY_PUBLIC_URL`. PHP выдаёт одноразовый билет, шлюз сам открывает сохранённое подключение. Без адреса шлюза терминал использует прежний поток PHP.

Symfony остаётся на 7.4. Ветка 8.0 закрыта security advisory, 8.1 требует Doctrine DBAL 4 и doctrine-bundle с поддержкой Symfony 8, а `gesdinet/jwt-refresh-token-bundle` 1.5 их не принимает. Сборку на несовместимый набор не переводили.
