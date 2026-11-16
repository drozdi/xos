#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
url=${XOS_URL:-}
server_id=${SERVER_ID:-}
token=${ENROLL_TOKEN:-}
dest=${DEST:-/opt/xos-agent}
ini=/etc/xos-agent/agent.ini
state=/var/lib/xos-agent

if ! command -v php >/dev/null 2>&1; then
  echo "Нужен PHP 8.1+ с расширениями curl, json, sodium, openssl" >&2
  exit 1
fi

php -r 'exit(PHP_VERSION_ID >= 80100 ? 0 : 1);' || {
  echo "Нужен PHP 8.1 или новее" >&2
  exit 1
}

for ext in curl json sodium openssl; do
  php -m | grep -qi "^$ext$" || {
    echo "Нет расширения PHP: $ext" >&2
    exit 1
  }
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Без root агент можно запустить из каталога:" >&2
  echo "php bin/xos-agent --config agent.ini" >&2
  exit 1
fi

mkdir -p "$dest" /etc/xos-agent "$state"
cp -a "$root/bin" "$root/src" "$root/protocol" "$dest/"
chmod 0700 "$state"

if [ ! -f "$ini" ]; then
  if [ -f "$root/agent.ini" ] && [ -f "$root/ca.pem" ]; then
    cp "$root/agent.ini" "$ini"
    cp "$root/ca.pem" /etc/xos-agent/ca.pem
    chmod 0640 "$ini" /etc/xos-agent/ca.pem
  else
    sed \
      -e "s|^url = .*|url = ${url}|" \
      -e "s|^server_id = .*|server_id = ${server_id}|" \
      -e "s|^enroll_token = .*|enroll_token = ${token}|" \
      "$root/agent.ini.example" > "$ini"
    chmod 0640 "$ini"
  fi
fi

cp "$root/systemd/xos-agent.service" /etc/systemd/system/xos-agent.service
systemctl daemon-reload
systemctl enable --now xos-agent.service
echo "Агент установлен в $dest"
