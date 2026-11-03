# XOS

Рабочий стол в браузере: React-клиент и API на Symfony 7.4.

DocumentRoot — `server/public`.

## Локально

Нужны PHP 8.4, Node.js 22 и MySQL 8.

```
cd server
composer install
cp .env.example .env
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:migrate
php bin/console main:claimant:sync
```

```
cd client
npm ci
npm run dev
```

Подробности, тесты и секреты: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md). Оглавление приложений: [docs/README.md](docs/README.md).

## Docker

Скопируйте `.env.docker.example` в `.env.docker`, заполните секреты и выполните `docker compose up --build`.

## Окружение

`APP_SECRET`, `JWT_PASSPHRASE`, `DATABASE_URL`, `SSH_SECRET_KEY`, `SSH_GATEWAY_SECRET`, `SSH_GATEWAY_PUBLIC_URL`, `SSH_GATEWAY_ORIGINS`, `MERCURE_URL`, `MERCURE_PUBLIC_URL`, `MERCURE_JWT_SECRET`, `SYMFONY_TRUSTED_PROXIES`, `INCCOM_FNS_SECRET`, `TS_TOKEN_SECRET`, `GITHUB_TOKEN_SECRET`, `YANDEX_DISK_TOKEN_SECRET`, `PKB_AT_REST_SECRET`.
