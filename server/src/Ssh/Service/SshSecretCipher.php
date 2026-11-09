<?php

namespace Ssh\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** AES-256-GCM. Stored value is enc:v1:base64(iv + tag + cipher). */
final class SshSecretCipher
{
    private const PREFIX = 'enc:v1:';

    private readonly string $sshSecretKey;

    public function __construct(
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
        #[Autowire('%env(default::SSH_SECRET_KEY)%')]
        ?string $sshSecretKey = null,
    ) {
        $this->sshSecretKey = $sshSecretKey ?? '';
    }

    public function usesDedicatedKey(): bool
    {
        return '' !== $this->sshSecretKey;
    }

    /** Decrypt with an explicit previous secret (usually the old APP_SECRET), then encrypt with the current key. */
    public function reencryptFrom(string $stored, string $fromSecret): string
    {
        if ('' === $stored || !str_starts_with($stored, self::PREFIX)) {
            return $this->encrypt($stored);
        }

        return $this->encrypt($this->decryptWith($stored, $fromSecret));
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

        return $this->decryptWith($stored, null);
    }

    private function decryptWith(string $stored, ?string $material): string
    {
        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if (false === $raw || strlen($raw) < 28) {
            throw new \RuntimeException('Повреждён секрет SSH');
        }

        $plain = openssl_decrypt(
            substr($raw, 28),
            'aes-256-gcm',
            $this->key($material),
            OPENSSL_RAW_DATA,
            substr($raw, 0, 12),
            substr($raw, 12, 16),
        );
        if (false === $plain) {
            throw new \RuntimeException('Не удалось расшифровать секрет SSH');
        }

        return $plain;
    }

    private function key(?string $material = null): string
    {
        $source = $material ?? ('' !== $this->sshSecretKey ? $this->sshSecretKey : $this->appSecret);

        return hash('sha256', $source, true);
    }
}
