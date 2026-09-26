<?php

namespace Github\Service;

use Doctrine\ORM\EntityManagerInterface;
use Github\Entity\UserGithubCredential;
use Github\Repository\UserGithubCredentialRepository;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class GithubConnectionService
{
    public function __construct(
        private readonly UserGithubCredentialRepository $credentialRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly GithubTokenCipher $tokenCipher,
        private readonly GithubApiClient $apiClient,
    ) {
    }

    public function getCredential(User $user): ?UserGithubCredential
    {
        return $this->credentialRepository->findOneByUser($user);
    }

    public function hasCredentials(User $user): bool
    {
        $credential = $this->getCredential($user);

        return $credential instanceof UserGithubCredential
            && '' !== trim($credential->getAccessToken());
    }

    /**
     * @return array{
     *     configured: bool,
     *     access_token_masked: string|null,
     *     default_owner: string|null,
     *     default_repo: string|null,
     *     github_login: string|null,
     *     encryption: bool
     * }
     */
    public function serializeCredentialPublic(User $user): array
    {
        $credential = $this->getCredential($user);
        if (!$credential instanceof UserGithubCredential) {
            return [
                'configured' => false,
                'access_token_masked' => null,
                'default_owner' => null,
                'default_repo' => null,
                'github_login' => null,
                'encryption' => $this->tokenCipher->isEnabled(),
            ];
        }

        $token = $credential->getAccessToken();
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
            'access_token_masked' => $masked,
            'default_owner' => $credential->getDefaultOwner(),
            'default_repo' => $credential->getDefaultRepo(),
            'github_login' => $credential->getGithubLogin(),
            'encryption' => $this->tokenCipher->isEnabled(),
        ];
    }

    /**
     * @param array{
     *     access_token?: string,
     *     default_owner?: string|null,
     *     default_repo?: string|null,
     *     github_login?: string|null
     * } $data
     */
    public function upsertCredential(User $user, array $data): UserGithubCredential
    {
        $accessToken = trim((string) ($data['access_token'] ?? ''));
        $defaultOwner = array_key_exists('default_owner', $data)
            ? (null === $data['default_owner'] ? null : trim((string) $data['default_owner']))
            : null;
        $defaultRepo = array_key_exists('default_repo', $data)
            ? (null === $data['default_repo'] ? null : trim((string) $data['default_repo']))
            : null;
        $githubLogin = array_key_exists('github_login', $data)
            ? (null === $data['github_login'] ? null : trim((string) $data['github_login']))
            : null;

        $credential = $this->getCredential($user);
        $isNew = !$credential instanceof UserGithubCredential;
        if ($isNew) {
            if ('' === $accessToken) {
                throw new BadRequestHttpException('Укажите access_token');
            }
            $credential = new UserGithubCredential($user);
            $this->entityManager->persist($credential);
        } elseif ('' === $accessToken && '' === trim($credential->getAccessToken())) {
            throw new BadRequestHttpException('Укажите access_token');
        }

        if ('' !== $accessToken) {
            $credential->setAccessToken($this->tokenCipher->encrypt($accessToken));
        }
        if (array_key_exists('default_owner', $data)) {
            $credential->setDefaultOwner($defaultOwner);
        }
        if (array_key_exists('default_repo', $data)) {
            $credential->setDefaultRepo($defaultRepo);
        }
        if (array_key_exists('github_login', $data)) {
            $credential->setGithubLogin($githubLogin);
        }
        $this->entityManager->flush();

        return $credential;
    }

    public function deleteCredential(User $user): void
    {
        $credential = $this->getCredential($user);
        if ($credential instanceof UserGithubCredential) {
            $this->entityManager->remove($credential);
            $this->entityManager->flush();
        }
    }

    /**
     * @return array{ok: bool, status: int|null, message: string, login?: string|null}
     */
    public function testConnection(User $user): array
    {
        try {
            $result = $this->apiClient->request($user, 'GET', '/user');
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

        $login = is_array($result['data']) && isset($result['data']['login'])
            ? (string) $result['data']['login']
            : null;

        if (null !== $login && '' !== $login) {
            $credential = $this->getCredential($user);
            if ($credential instanceof UserGithubCredential) {
                $credential->setGithubLogin($login);
                $this->entityManager->flush();
            }
        }

        return [
            'ok' => true,
            'status' => $result['status'],
            'message' => 'Связь с GitHub установлена',
            'login' => $login,
        ];
    }
}
