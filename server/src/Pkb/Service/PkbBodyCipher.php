<?php

namespace Pkb\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * AES-256-GCM for PKB note bodies at rest. Prefix enc:v1:base64(iv+tag+cipher).
 * Without PKB_AT_REST_SECRET stores plaintext (dev); with secret encrypts when vault flag is on.
 */
final class PkbBodyCipher
{
    private const PREFIX = 'enc:v1:';

    public function __construct(
        #[Autowire('%env(default::PKB_AT_REST_SECRET)%')]
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
            throw new \RuntimeException('Не удалось зашифровать тело заметки PKB');
        }

        return self::PREFIX.base64_encode($iv.$tag.$cipher);
    }

    public function decrypt(string $stored): string
    {
        if ('' === $stored || !$this->isEncrypted($stored)) {
            return $stored;
        }
        if (!$this->isEnabled()) {
            throw new \RuntimeException('PKB_AT_REST_SECRET не задан, а заметка зашифрована');
        }

        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if (false === $raw || strlen($raw) < 28) {
            throw new \RuntimeException('Повреждённое зашифрованное тело заметки PKB');
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $cipher = substr($raw, 28);
        $plain = openssl_decrypt($cipher, 'aes-256-gcm', $this->deriveKey(), OPENSSL_RAW_DATA, $iv, $tag);
        if (false === $plain) {
            throw new \RuntimeException('Не удалось расшифровать тело заметки PKB');
        }

        return $plain;
    }

    private function deriveKey(): string
    {
        return hash('sha256', (string) $this->secret, true);
    }
}
