# XOS

Веб-оболочка: React-клиент и API на Symfony.

DocumentRoot веб-сервера — `server/public`. Корень репозитория не должен отдавать файлы вне этого каталога и собранного клиента.

Запуск для разработки, JWT, секреты и тесты: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

Docker: `docker compose up --build` поднимает PHP 8.4 и MySQL 8. Перед первым входом задайте `APP_SECRET` и `SSH_SECRET_KEY` (и остальные `*_SECRET`) в окружении контейнера.
