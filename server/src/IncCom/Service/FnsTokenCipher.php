<?php

namespace IncCom\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * AES-256-GCM for FNS master_token. Prefix enc:v1:base64(iv+tag+cipher).
 * Without INCCOM_FNS_SECRET stores plaintext (dev); with secret encrypts on write.
 */
final class FnsTokenCipher
{
    private const PREFIX = 'enc:v1:';

    public function __construct(
        #[Autowire('%env(default::INCCOM_FNS_SECRET)%')]
        private readonly ?string $secret = null,
    ) {
    }

    public function isEnabled(): bool
    {
        return null !== $this->secret && '' !== trim($this->secret);
    }

    public function isEncrypted(string $value): bool
    {
        return str_starts_with($value, self::PREFIX);
    }

    public function encrypt(string $plaintext): string
    {
        $plaintext = trim($plaintext);
        if ('' === $plaintext) {
            return '';
        }
        if (!$this->isEnabled()) {
            return $plaintext;
        }
        if ($this->isEncrypted($plaintext)) {
            return $plaintext;
        }

        $key = $this->deriveKey();
        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if (false === $cipher) {
            throw new \RuntimeException('Не удалось зашифровать FNS master_token');
        }

        return self::PREFIX.base64_encode($iv.$tag.$cipher);
    }

    public function decrypt(string $stored): string
    {
        $stored = trim($stored);
        if ('' === $stored || !$this->isEncrypted($stored)) {
            return $stored;
        }
        if (!$this->isEnabled()) {
            throw new \RuntimeException('INCCOM_FNS_SECRET не задан, а токен зашифрован');
        }

        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if (false === $raw || strlen($raw) < 28) {
            throw new \RuntimeException('Повреждённый FNS master_token');
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $cipher = substr($raw, 28);
        $plain = openssl_decrypt($cipher, 'aes-256-gcm', $this->deriveKey(), OPENSSL_RAW_DATA, $iv, $tag);
        if (false === $plain) {
            throw new \RuntimeException('Не удалось расшифровать FNS master_token');
        }

        return $plain;
    }

    private function deriveKey(): string
    {
        return hash('sha256', (string) $this->secret, true);
    }
}
