#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
url=${XOS_URL:-}
server_id=${SERVER_ID:-}
token=${ENROLL_TOKEN:-}
dest=${DEST:-/opt/xos-agent}
ini=/etc/xos-agent/agent.ini
state=/opt/xos-agent

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
chmod 0700 "$state"
if [ "$root" != "$dest" ]; then
  for name in bin src protocol; do
    rm -rf "$dest/$name"
    mv "$root/$name" "$dest/$name"
  done
fi

template=$root/agent.ini
if [ ! -f "$template" ]; then
  template=$root/agent.ini.example
fi

if [ ! -f "$ini" ]; then
  if [ -f "$root/agent.ini" ] && [ -f "$root/ca.pem" ]; then
    mv "$root/agent.ini" "$ini"
    mv "$root/ca.pem" /etc/xos-agent/ca.pem
    chmod 0640 "$ini" /etc/xos-agent/ca.pem
  else
    sed \
      -e "s|^url = .*|url = ${url}|" \
      -e "s|^server_id = .*|server_id = ${server_id}|" \
      -e "s|^enroll_token = .*|enroll_token = ${token}|" \
      "$root/agent.ini.example" > "$ini"
    chmod 0640 "$ini"
  fi
elif [ -f "$template" ]; then
  XOS_INI=$ini XOS_FRESH=$template php <<'PHP'
<?php
$current = parse_ini_file(getenv('XOS_INI'), true, INI_SCANNER_RAW);
$fresh = parse_ini_file(getenv('XOS_FRESH'), true, INI_SCANNER_RAW);
if (!is_array($current) || !is_array($fresh)) {
    fwrite(STDERR, "Настройки агента не читаются\n");
    exit(1);
}
$added = 0;
foreach ($fresh as $section => $keys) {
    if (!is_array($keys)) {
        continue;
    }
    if (!isset($current[$section]) || !is_array($current[$section])) {
        $current[$section] = [];
    }
    foreach ($keys as $key => $value) {
        if (!array_key_exists($key, $current[$section])) {
            $current[$section][$key] = $value;
            $added++;
        }
    }
}
if (0 === $added) {
    exit(0);
}
$text = '';
foreach ($current as $section => $keys) {
    if (!is_array($keys)) {
        continue;
    }
    $text .= '['.$section."]\n";
    foreach ($keys as $key => $value) {
        $text .= $key.' = '.$value."\n";
    }
    $text .= "\n";
}
if (false === file_put_contents(getenv('XOS_INI'), $text)) {
    fwrite(STDERR, "Настройки агента не записались\n");
    exit(1);
}
echo "В настройки добавлено ключей: ".$added."\n";
PHP
  chmod 0640 "$ini"
fi

if [ -f "$root/agent.ini" ] && [ "$root/agent.ini" != "$ini" ]; then
  rm -f "$root/agent.ini"
fi

if [ -f "$root/ca.pem" ]; then
  mv -f "$root/ca.pem" /etc/xos-agent/ca.pem
  chmod 0640 /etc/xos-agent/ca.pem
fi

unit=/etc/systemd/system/xos-agent.service
if [ "$root/systemd/xos-agent.service" != "$unit" ]; then
  mv -f "$root/systemd/xos-agent.service" "$unit"
fi
systemctl daemon-reload
systemctl enable xos-agent.service
systemctl restart xos-agent.service
echo "Агент установлен в $dest"
