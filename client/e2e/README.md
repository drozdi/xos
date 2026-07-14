# E2E тесты (Playwright)

## Установка

```bash
cd client
npm install
npx playwright install chromium
```

## Запуск

Только UI (без backend):

```bash
npm run test:e2e
```

Полный сценарий (login → app → reload):

1. Запустите server (`http://localhost:8000`) с пользователем в БД
2. Запустите client (`npm run dev`) или положитесь на webServer в конфиге
3. Укажите credentials:

```bash
E2E_INTEGRATION=true E2E_USERNAME=admin E2E_PASSWORD=secret npm run test:e2e
```

## Переменные

| Переменная | Описание |
|------------|----------|
| `E2E_INTEGRATION` | `true` — включить тест с login/API |
| `E2E_USERNAME` | Логин пользователя |
| `E2E_PASSWORD` | Пароль |
| `PLAYWRIGHT_BASE_URL` | URL клиента (default `http://localhost:5173`) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` — не стартовать Vite автоматически |
