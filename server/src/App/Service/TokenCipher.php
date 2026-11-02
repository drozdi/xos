<?php

namespace App\Service;

/** AES-256-GCM. Stored value is enc:v1:base64(iv + tag + cipher). */
final class TokenCipher
{
    public const PREFIX = 'enc:v1:';

    public function __construct(
        private readonly string $secret,
        private readonly bool $requireSecret,
    ) {
    }

    public function isEnabled(): bool
    {
        return '' !== trim($this->secret);
    }

    public function isEncrypted(string $value): bool
    {
        return str_starts_with($value, self::PREFIX);
    }

    public function encrypt(string $plaintext): string
    {
        if ('' === $plaintext) {
            return '';
        }
        if (!$this->isEnabled()) {
            if ($this->requireSecret) {
                throw new \RuntimeException('Token encryption secret is required in prod');
            }

            return $plaintext;
        }
        if ($this->isEncrypted($plaintext)) {
            return $plaintext;
        }

        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $this->key(), OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if (false === $cipher) {
            throw new \RuntimeException('Не удалось зашифровать секрет');
        }

        return self::PREFIX.base64_encode($iv.$tag.$cipher);
    }

    public function decrypt(string $stored): string
    {
        if ('' === $stored || !$this->isEncrypted($stored)) {
            return $stored;
        }
        if (!$this->isEnabled()) {
            throw new \RuntimeException('Не удалось расшифровать секрет: ключ не задан');
        }

        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if (false === $raw || strlen($raw) < 28) {
            throw new \RuntimeException('Повреждён секрет');
        }

        $plain = openssl_decrypt(
            substr($raw, 28),
            'aes-256-gcm',
            $this->key(),
            OPENSSL_RAW_DATA,
            substr($raw, 0, 12),
            substr($raw, 12, 16),
        );
        if (false === $plain) {
            throw new \RuntimeException('Не удалось расшифровать секрет');
        }

        return $plain;
    }

    private function key(): string
    {
        return hash('sha256', $this->secret, true);
    }
}
