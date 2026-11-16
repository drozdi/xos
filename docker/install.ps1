$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$envFile = Join-Path $root '.env.docker'

function New-Secret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
}

if (-not (Test-Path $envFile)) {
    $mysqlPassword = New-Secret
    $mysqlRoot = New-Secret
    @"
APP_SECRET=$(New-Secret)
SYMFONY_TRUSTED_PROXIES=private_ranges
JWT_PASSPHRASE=$(New-Secret)
DATABASE_URL=mysql://xos:${mysqlPassword}@mysql:3306/xos?serverVersion=8
MYSQL_DATABASE=xos
MYSQL_USER=xos
MYSQL_PASSWORD=${mysqlPassword}
MYSQL_ROOT_PASSWORD=${mysqlRoot}
MERCURE_PUBLIC_URL=http://localhost:9080
MERCURE_JWT_SECRET=$(New-Secret)
MERCURE_PUBLISHER_JWT_KEY=$(New-Secret)
MERCURE_SUBSCRIBER_JWT_KEY=$(New-Secret)
SSH_GATEWAY_SECRET=$(New-Secret)
SSH_GATEWAY_PUBLIC_URL=ws://localhost:7681
SSH_GATEWAY_ORIGINS=
SSH_SECRET_KEY=$(New-Secret)
RDP_GATEWAY_SECRET=$(New-Secret)
RDP_GATEWAY_PUBLIC_URL=ws://localhost:7682
RDP_GATEWAY_ORIGINS=
RDP_GUACD_HOST=guacd
RDP_DENY_CIDRS=
GITHUB_TOKEN_SECRET=$(New-Secret)
TS_TOKEN_SECRET=$(New-Secret)
INCCOM_FNS_SECRET=$(New-Secret)
YANDEX_DISK_TOKEN_SECRET=$(New-Secret)
PKB_AT_REST_SECRET=$(New-Secret)
"@ | Set-Content -Path $envFile -Encoding ascii
    Write-Host 'Создан .env.docker'
} else {
    Write-Host 'Используется существующий .env.docker'
}

docker compose up --build -d
Write-Host 'Стол: http://localhost:8080'
