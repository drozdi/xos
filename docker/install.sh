#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
env_file="$root/.env.docker"

secret() {
  openssl rand -hex 32
}

if [ ! -f "$env_file" ]; then
  mysql_password=$(secret)
  mysql_root=$(secret)
  cat > "$env_file" <<EOF
APP_SECRET=$(secret)
SYMFONY_TRUSTED_PROXIES=private_ranges
JWT_PASSPHRASE=$(secret)
DATABASE_URL=mysql://xos:${mysql_password}@mysql:3306/xos?serverVersion=8
MYSQL_DATABASE=xos
MYSQL_USER=xos
MYSQL_PASSWORD=${mysql_password}
MYSQL_ROOT_PASSWORD=${mysql_root}
MERCURE_PUBLIC_URL=http://localhost:9080
MERCURE_JWT_SECRET=$(secret)
MERCURE_PUBLISHER_JWT_KEY=$(secret)
MERCURE_SUBSCRIBER_JWT_KEY=$(secret)
SSH_GATEWAY_SECRET=$(secret)
SSH_GATEWAY_PUBLIC_URL=ws://localhost:7681
SSH_GATEWAY_ORIGINS=
SSH_SECRET_KEY=$(secret)
RDP_GATEWAY_SECRET=$(secret)
RDP_GATEWAY_PUBLIC_URL=ws://localhost:7682
RDP_GATEWAY_ORIGINS=
RDP_GUACD_HOST=guacd
RDP_DENY_CIDRS=
GITHUB_TOKEN_SECRET=$(secret)
TS_TOKEN_SECRET=$(secret)
INCCOM_FNS_SECRET=$(secret)
YANDEX_DISK_TOKEN_SECRET=$(secret)
PKB_AT_REST_SECRET=$(secret)
EOF
  echo "Создан .env.docker"
else
  echo "Используется существующий .env.docker"
fi

docker compose up --build -d
echo "Стол: http://localhost:8080"
