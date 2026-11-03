#!/bin/sh
set -e
cd /var/www/html
mkdir -p var config/jwt public/uploads
if [ ! -f config/jwt/private.pem ]; then
  php bin/console lexik:jwt:generate-keypair --skip-if-exists
fi
if ! php bin/console dbal:run-sql "SELECT 1 FROM main_user LIMIT 1" >/dev/null 2>&1; then
  php bin/console doctrine:migrations:execute 'DoctrineMigrations\Version20260801000000' --up --no-interaction
  php bin/console doctrine:migrations:version --add --all --no-interaction
fi
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console cache:warmup
chown -R www-data:www-data var public/uploads
exec apache2-foreground
