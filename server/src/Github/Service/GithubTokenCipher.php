<?php

namespace Github\Service;

use App\Service\TokenCipher;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** AES-256-GCM for GitHub PAT. Prod requires GITHUB_TOKEN_SECRET. */
final class GithubTokenCipher
{
    private readonly TokenCipher $cipher;

    public function __construct(
        #[Autowire('%env(default::GITHUB_TOKEN_SECRET)%')]
        private readonly ?string $secret = null,
        #[Autowire('%kernel.environment%')]
        string $environment = 'dev',
    ) {
        $this->cipher = new TokenCipher(trim((string) $this->secret), 'prod' === $environment);
    }

    public function isEnabled(): bool
    {
        return $this->cipher->isEnabled();
    }

    public function isEncrypted(string $value): bool
    {
        return $this->cipher->isEncrypted($value);
    }

    public function encrypt(string $plaintext): string
    {
        return $this->cipher->encrypt(trim($plaintext));
    }

    public function decrypt(string $stored): string
    {
        return $this->cipher->decrypt(trim($stored));
    }
}
