<?php

namespace Ts\Service;

use Main\Entity\User;
use Ts\Repository\UserTsCredentialRepository;

final class TsWorkitemService
{
    private const MINE_MAX_PAGES = 5;
    private const MINE_TARGET_COUNT = 50;

    public function __construct(
        private readonly TsApiClient $apiClient,
        private readonly UserTsCredentialRepository $credentialRepository,
    ) {
    }

    /**
     * @return mixed
     */
    public function listWorkspaces(User $user): mixed
    {
        return $this->apiClient->request($user, 'GET', '/workspaces')['data'];
    }

    /**
     * @return mixed
     */
    public function listWorkitems(
        User $user,
        string $workspace,
        ?int $maxItemsCount = null,
        ?string $fromToken = null,
        bool $mine = false,
    ): mixed {
        $workspace = $this->normalizeSegment($workspace, 'workspace');
        $pageSize = $maxItemsCount ?? 50;

        if (!$mine) {
            return $this->apiClient->request($user, 'GET', '/workspaces/'.rawurlencode($workspace).'/workitems', [
                'maxItemsCount' => $pageSize,
                'fromToken' => $fromToken,
            ])['data'];
        }

        $identities = $this->resolveMineIdentities($user);
        $collected = [];
        $token = $fromToken;
        $lastNext = null;
        $pages = 0;

        while ($pages < self::MINE_MAX_PAGES && \count($collected) < self::MINE_TARGET_COUNT) {
            ++$pages;
            $data = $this->apiClient->request($user, 'GET', '/workspaces/'.rawurlencode($workspace).'/workitems', [
                'maxItemsCount' => $pageSize,
                'fromToken' => $token,
            ])['data'];

            $page = $this->normalizePage($data);
            foreach ($page['items'] as $item) {
                if ($this->isAssignedToMe($item, $identities)) {
                    $collected[] = $item;
                }
            }
            $lastNext = $page['nextToken'];
            if (null === $lastNext || '' === $lastNext) {
                break;
            }
            $token = $lastNext;
        }

        return [
            'fromToken' => $fromToken,
            'maxItemsCount' => $pageSize,
            'nextToken' => $lastNext,
            'items' => \array_slice($collected, 0, self::MINE_TARGET_COUNT),
            'mine' => true,
        ];
    }

    /**
     * @return mixed
     */
    public function getWorkitem(User $user, string $workspace, string $workitem): mixed
    {
        $workspace = $this->normalizeSegment($workspace, 'workspace');
        $workitem = $this->normalizeSegment($workitem, 'workitem');

        return $this->apiClient->request(
            $user,
            'GET',
            '/workspaces/'.rawurlencode($workspace).'/workitems/'.rawurlencode($workitem),
        )['data'];
    }

    /**
     * @param array{name?: string, description?: string, status?: string} $payload
     *
     * @return mixed
     */
    public function updateWorkitem(User $user, string $workspace, string $workitem, array $payload): mixed
    {
        $workspace = $this->normalizeSegment($workspace, 'workspace');
        $workitem = $this->normalizeSegment($workitem, 'workitem');

        $body = [];
        foreach (['name', 'description', 'status'] as $field) {
            if (array_key_exists($field, $payload) && null !== $payload[$field]) {
                $body[$field] = is_string($payload[$field]) ? $payload[$field] : (string) $payload[$field];
            }
        }
        if ($body === []) {
            throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException(
                'Укажите хотя бы одно поле: name, description, status',
            );
        }

        return $this->apiClient->request(
            $user,
            'PATCH',
            '/workspaces/'.rawurlencode($workspace).'/workitems/'.rawurlencode($workitem),
            null,
            $body,
        )['data'];
    }

    /**
     * @return list<string>
     */
    private function resolveMineIdentities(User $user): array
    {
        $ids = [];
        $credential = $this->credentialRepository->findOneByUser($user);
        if (null !== $credential && null !== $credential->getTsUsername() && '' !== $credential->getTsUsername()) {
            $ids[] = mb_strtolower($credential->getTsUsername());
        }
        $login = $user->getLogin();
        if (null !== $login && '' !== trim($login)) {
            $ids[] = mb_strtolower(trim($login));
        }
        $email = $user->getEmail();
        if (null !== $email && '' !== trim($email)) {
            $ids[] = mb_strtolower(trim($email));
        }

        return array_values(array_unique(array_filter($ids, static fn (string $v): bool => '' !== $v)));
    }

    /**
     * @param array<string, mixed> $item
     * @param list<string>         $identities
     */
    private function isAssignedToMe(array $item, array $identities): bool
    {
        if ($identities === []) {
            return false;
        }

        $people = [];
        if (isset($item['assignee']) && is_array($item['assignee'])) {
            $people[] = $item['assignee'];
        }
        if (isset($item['responsibles']) && is_array($item['responsibles'])) {
            foreach ($item['responsibles'] as $person) {
                if (is_array($person)) {
                    $people[] = $person;
                }
            }
        }

        foreach ($people as $person) {
            foreach (['username', 'email', 'id', 'displayName'] as $field) {
                $value = $person[$field] ?? null;
                if (!is_string($value) && !is_numeric($value)) {
                    continue;
                }
                $normalized = mb_strtolower(trim((string) $value));
                if ('' !== $normalized && in_array($normalized, $identities, true)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array{items: list<array<string, mixed>>, nextToken: string|null}
     */
    private function normalizePage(mixed $data): array
    {
        if (is_array($data) && array_is_list($data)) {
            /** @var list<array<string, mixed>> $items */
            $items = array_values(array_filter($data, 'is_array'));

            return ['items' => $items, 'nextToken' => null];
        }
        if (!is_array($data)) {
            return ['items' => [], 'nextToken' => null];
        }
        $rawItems = $data['items'] ?? [];
        $items = [];
        if (is_array($rawItems)) {
            foreach ($rawItems as $row) {
                if (is_array($row)) {
                    $items[] = $row;
                }
            }
        }
        $next = $data['nextToken'] ?? null;

        return [
            'items' => $items,
            'nextToken' => is_string($next) && '' !== $next ? $next : null,
        ];
    }

    private function normalizeSegment(string $value, string $label): string
    {
        $value = trim($value);
        if ('' === $value) {
            throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException('Укажите '.$label);
        }
        if (str_contains($value, '/') || str_contains($value, '\\')) {
            throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException('Некорректный '.$label);
        }

        return $value;
    }
}
