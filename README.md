# XOS

CRM-система с **десктоп-окружением в браузере**: окна, панель задач, меню «Пуск», сохранение состояния. Бизнес-приложения запускаются как отдельные окна поверх рабочего стола.

## Стек

| Часть | Технологии |
|-------|------------|
| **Server** | PHP 8.2+, Symfony 7.3, Doctrine ORM, MySQL, JWT (Lexik + Gesdinet refresh) |
| **Client** | React 19, TypeScript, Vite 8, Tailwind 4, Mantine 9, Zustand, TanStack Query |

## Требования

- PHP 8.2+ с расширениями `ctype`, `iconv`
- Composer 2.x
- MySQL 8.0+
- Node.js 20+
- npm 10+

## Быстрый старт

### 1. Сервер

```bash
cd server
composer install
cp .env.example .env
# Отредактируйте DATABASE_URL и APP_SECRET в .env

php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:migrate
```

Запуск (один из вариантов):

```bash
# Symfony CLI
symfony server:start

# или встроенный PHP-сервер
php -S localhost:8000 -t public
```

API по умолчанию: `http://localhost:8000`

### 2. Клиент

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 3. Вход

Откройте [http://localhost:5173](http://localhost:5173) и войдите с учётными данными пользователя из БД.

## Переменные окружения

### Server (`server/.env`)

| Переменная | Назначение |
|------------|------------|
| `APP_SECRET` | Секрет Symfony |
| `DATABASE_URL` | Подключение к MySQL (`mysql://user:pass@127.0.0.1:3306/xos`) |
| `JWT_SECRET_KEY` / `JWT_PUBLIC_KEY` | Пути к ключам JWT (генерируются `lexik:jwt:generate-keypair`) |
| `JWT_PASSPHRASE` | Пароль ключа (по умолчанию в `.env.example`: `xos_jwt_pass`) |
| `CORS_ALLOW_ORIGIN` | Разрешённые origin для CORS (включает `localhost:5173`) |

### Client (`client/.env`)

| Переменная | Назначение |
|------------|------------|
| `VITE_API_URL` | URL API (dev: `http://localhost:8000`) |
| `VITE_USE_API_SETTINGS` | `true` — синхронизация настроек с `/api/settings`; `false` — только localStorage |

## Тесты

```bash
# Server (из каталога server/)
vendor/bin/phpunit

# Client (из каталога client/)
npm run test

# E2E smoke (Playwright, этап 12.3)
npm run test:e2e
```

## Документация

| Документ | Описание |
|----------|----------|
| [docs/TZ.md](docs/TZ.md) | Техническое задание |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура системы |
| [docs/API_SPEC.md](docs/API_SPEC.md) | REST API |
| [docs/PLAN.md](docs/PLAN.md) | План реализации |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Как создать приложение в `apps/` |

## Структура репозитория

```
xos/
├── server/          # Symfony API
├── client/          # React SPA (desktop shell + apps)
└── docs/            # ТЗ, архитектура, API, план
```
