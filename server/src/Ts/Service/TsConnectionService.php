<?php

namespace Ts\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Ts\Entity\UserTsCredential;
use Ts\Repository\UserTsCredentialRepository;

class TsConnectionService
{
    public function __construct(
        private readonly UserTsCredentialRepository $credentialRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly TsTokenCipher $tokenCipher,
        private readonly TsApiClient $apiClient,
    ) {
    }

    public function getCredential(User $user): ?UserTsCredential
    {
        return $this->credentialRepository->findOneByUser($user);
    }

    public function hasCredentials(User $user): bool
    {
        $credential = $this->getCredential($user);

        return $credential instanceof UserTsCredential
            && '' !== trim($credential->getBaseUrl())
            && '' !== trim($credential->getPrivateToken());
    }

    /**
     * @return array{configured: bool, base_url: string|null, private_token_masked: string|null, ts_username: string|null, encryption: bool}
     */
    public function serializeCredentialPublic(User $user): array
    {
        $credential = $this->getCredential($user);
        if (!$credential instanceof UserTsCredential) {
            return [
                'configured' => false,
                'base_url' => null,
                'private_token_masked' => null,
                'ts_username' => null,
                'encryption' => $this->tokenCipher->isEnabled(),
            ];
        }

        $token = $credential->getPrivateToken();
        try {
            $plain = $this->tokenCipher->decrypt($token);
        } catch (\Throwable) {
            $plain = '';
        }
        $masked = '' === $plain
            ? ($this->tokenCipher->isEncrypted($token) ? '••••••••' : null)
            : (strlen($plain) <= 8
                ? str_repeat('*', strlen($plain))
                : substr($plain, 0, 4).str_repeat('*', max(4, strlen($plain) - 8)).substr($plain, -4));

        return [
            'configured' => $this->hasCredentials($user),
            'base_url' => $credential->getBaseUrl(),
            'private_token_masked' => $masked,
            'ts_username' => $credential->getTsUsername(),
            'encryption' => $this->tokenCipher->isEnabled(),
        ];
    }

    /**
     * @param array{base_url?: string, private_token?: string, ts_username?: string|null} $data
     */
    public function upsertCredential(User $user, array $data): UserTsCredential
    {
        $baseUrl = rtrim(trim((string) ($data['base_url'] ?? '')), '/');
        $privateToken = trim((string) ($data['private_token'] ?? ''));
        $tsUsername = array_key_exists('ts_username', $data)
            ? (null === $data['ts_username'] ? null : trim((string) $data['ts_username']))
            : null;

        if ('' === $baseUrl) {
            throw new BadRequestHttpException('Укажите base_url');
        }
        if (!preg_match('#^https?://#i', $baseUrl)) {
            throw new BadRequestHttpException('base_url должен начинаться с http:// или https://');
        }

        $credential = $this->getCredential($user);
        $isNew = !$credential instanceof UserTsCredential;
        if ($isNew) {
            if ('' === $privateToken) {
                throw new BadRequestHttpException('Укажите base_url и private_token');
            }
            $credential = new UserTsCredential($user);
            $this->entityManager->persist($credential);
        } elseif ('' === $privateToken && '' === trim($credential->getPrivateToken())) {
            throw new BadRequestHttpException('Укажите private_token');
        }

        $credential->setBaseUrl($baseUrl);
        if ('' !== $privateToken) {
            $credential->setPrivateToken($this->tokenCipher->encrypt($privateToken));
        }
        if (array_key_exists('ts_username', $data)) {
            $credential->setTsUsername($tsUsername);
        }
        $this->entityManager->flush();

        return $credential;
    }

    public function deleteCredential(User $user): void
    {
        $credential = $this->getCredential($user);
        if ($credential instanceof UserTsCredential) {
            $this->entityManager->remove($credential);
            $this->entityManager->flush();
        }
    }

    /**
     * @return array{ok: bool, status: int|null, message: string}
     */
    public function testConnection(User $user): array
    {
        try {
            $result = $this->apiClient->request($user, 'GET', '/workspaces');
        } catch (BadRequestHttpException $e) {
            throw $e;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return [
                'ok' => false,
                'status' => $e->getStatusCode() >= 400 ? $e->getStatusCode() : null,
                'message' => $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'status' => null,
                'message' => $e->getMessage(),
            ];
        }

        return [
            'ok' => true,
            'status' => $result['status'],
            'message' => 'Связь с TeamStorm установлена',
        ];
    }
}
