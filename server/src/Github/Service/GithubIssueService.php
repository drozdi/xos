<?php

namespace Github\Service;

use Github\Repository\UserGithubCredentialRepository;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class GithubIssueService
{
    public function __construct(
        private readonly GithubApiClient $apiClient,
        private readonly UserGithubCredentialRepository $credentialRepository,
    ) {
    }

    /**
     * @return array{owner: string, repo: string}
     */
    public function resolveRepo(User $user, ?string $owner = null, ?string $repo = null): array
    {
        $credential = $this->credentialRepository->findOneByUser($user);
        $owner = trim((string) ($owner ?: $credential?->getDefaultOwner()));
        $repo = trim((string) ($repo ?: $credential?->getDefaultRepo()));
        if ('' === $owner || '' === $repo) {
            throw new BadRequestHttpException('Укажите owner и repo (или default_owner/default_repo в credentials)');
        }
        $this->assertSegment($owner, 'owner');
        $this->assertSegment($repo, 'repo');

        return ['owner' => $owner, 'repo' => $repo];
    }

    /**
     * @return mixed
     */
    public function listIssues(
        User $user,
        ?string $owner = null,
        ?string $repo = null,
        string $state = 'open',
        int $perPage = 30,
        int $page = 1,
    ): mixed {
        $ref = $this->resolveRepo($user, $owner, $repo);
        $state = in_array($state, ['open', 'closed', 'all'], true) ? $state : 'open';
        $perPage = max(1, min(100, $perPage));
        $page = max(1, $page);

        return $this->apiClient->request(
            $user,
            'GET',
            '/repos/'.rawurlencode($ref['owner']).'/'.rawurlencode($ref['repo']).'/issues',
            [
                'state' => $state,
                'per_page' => $perPage,
                'page' => $page,
            ],
        )['data'];
    }

    /**
     * @return mixed
     */
    public function getIssue(User $user, int $number, ?string $owner = null, ?string $repo = null): mixed
    {
        $ref = $this->resolveRepo($user, $owner, $repo);
        if ($number < 1) {
            throw new BadRequestHttpException('Некорректный номер issue');
        }

        return $this->apiClient->request(
            $user,
            'GET',
            '/repos/'.rawurlencode($ref['owner']).'/'.rawurlencode($ref['repo']).'/issues/'.$number,
        )['data'];
    }

    /**
     * @param array{title?: string, body?: string, state?: string} $payload
     *
     * @return mixed
     */
    public function updateIssue(
        User $user,
        int $number,
        array $payload,
        ?string $owner = null,
        ?string $repo = null,
    ): mixed {
        $ref = $this->resolveRepo($user, $owner, $repo);
        if ($number < 1) {
            throw new BadRequestHttpException('Некорректный номер issue');
        }

        $body = [];
        foreach (['title', 'body', 'state'] as $field) {
            if (array_key_exists($field, $payload) && null !== $payload[$field]) {
                $body[$field] = is_string($payload[$field]) ? $payload[$field] : (string) $payload[$field];
            }
        }
        if ($body === []) {
            throw new BadRequestHttpException('Укажите хотя бы одно поле: title, body, state');
        }

        return $this->apiClient->request(
            $user,
            'PATCH',
            '/repos/'.rawurlencode($ref['owner']).'/'.rawurlencode($ref['repo']).'/issues/'.$number,
            null,
            $body,
        )['data'];
    }

    private function assertSegment(string $value, string $label): void
    {
        if (str_contains($value, '/') || str_contains($value, '\\')) {
            throw new BadRequestHttpException('Некорректный '.$label);
        }
    }
}
