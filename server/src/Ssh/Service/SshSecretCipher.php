<?php

namespace Ssh\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** AES-256-GCM. Stored value is enc:v1:base64(iv + tag + cipher). */
final class SshSecretCipher
{
    private const PREFIX = 'enc:v1:';

    public function __construct(
        #[Autowire('%kernel.secret%')]
        private readonly string $secret,
    ) {
    }

    public function encrypt(string $plaintext): string
    {
        if ('' === $plaintext) {
            return '';
        }
        if (str_starts_with($plaintext, self::PREFIX)) {
            return $plaintext;
        }

        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $this->key(), OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if (false === $cipher) {
            throw new \RuntimeException('Не удалось зашифровать секрет SSH');
        }

        return self::PREFIX.base64_encode($iv.$tag.$cipher);
    }

    public function decrypt(string $stored): string
    {
        if ('' === $stored || !str_starts_with($stored, self::PREFIX)) {
            return $stored;
        }

        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if (false === $raw || strlen($raw) < 28) {
            throw new \RuntimeException('Повреждён секрет SSH');
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
            throw new \RuntimeException('Не удалось расшифровать секрет SSH');
        }

        return $plain;
    }

    private function key(): string
    {
        return hash('sha256', $this->secret, true);
    }
}
