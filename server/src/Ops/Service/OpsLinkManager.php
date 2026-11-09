<?php

namespace Ops\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Ops\Entity\OpsLink;
use Ops\Repository\OpsLinkRepository;
use Ssh\Repository\SshConnectionRepository;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class OpsLinkManager
{
    public function __construct(
        private readonly OpsLinkRepository $links,
        private readonly SshConnectionRepository $sshConnections,
        private readonly EntityManagerInterface $entityManager,
        private readonly SshSecretCipher $cipher,
        private readonly TunnelRuntime $tunnels,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $user, string $kind): array
    {
        return array_map(fn (OpsLink $link): array => $this->serialize($user, $link), $this->links->findForUser($user, $kind));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function create(User $user, string $kind, array $data): array
    {
        $payload = OpsLinkPayload::parse($kind, $data, true);
        $link = new OpsLink($user, $kind);
        $this->apply($user, $link, $payload, true);
        $this->entityManager->persist($link);
        $this->entityManager->flush();

        return $this->serialize($user, $link);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function update(User $user, string $kind, int $id, array $data): array
    {
        $link = $this->require($user, $kind, $id);
        if ('tunnel' === $kind) {
            $this->tunnels->stop($user, $link);
        }
        $payload = OpsLinkPayload::parse($kind, $data, false);
        $this->apply($user, $link, $payload, false);
        $this->entityManager->flush();

        return $this->serialize($user, $link);
    }

    public function delete(User $user, string $kind, int $id): void
    {
        $link = $this->require($user, $kind, $id);
        if ('tunnel' === $kind) {
            $this->tunnels->stop($user, $link);
        }
        $this->entityManager->remove($link);
        $this->entityManager->flush();
    }

    public function require(User $user, string $kind, int $id): OpsLink
    {
        $link = $this->links->findOneForUser($user, $kind, $id);
        if (!$link instanceof OpsLink) {
            throw new NotFoundHttpException('Подключение не найдено');
        }

        return $link;
    }

    /**
     * @param array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * } $payload
     */
    private function apply(User $user, OpsLink $link, array $payload, bool $isNew): void
    {
        $link
            ->setName($payload['name'])
            ->setHost($payload['host'])
            ->setPort($payload['port'])
            ->setUsername($payload['username'])
            ->setDriver($payload['driver'])
            ->setDatabaseName($payload['database_name'])
            ->setListenPort($payload['listen_port'])
            ->setTargetHost($payload['target_host'])
            ->setTargetPort($payload['target_port']);

        if (null !== $payload['secret']) {
            $link->setSecret($this->cipher->encrypt($payload['secret']));
        } elseif ($isNew) {
            $link->setSecret('');
        }

        if ('tunnel' !== $link->getKind()) {
            $link->setSshConnection(null);

            return;
        }
        $sshId = $payload['ssh_connection_id'];
        if (null === $sshId) {
            throw new BadRequestHttpException('Подключение SSH не указано');
        }
        $ssh = $this->sshConnections->findOneForUser($user, $sshId);
        if (null === $ssh) {
            throw new BadRequestHttpException('Подключение SSH не найдено');
        }
        $link->setSshConnection($ssh);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $user, OpsLink $link): array
    {
        $ssh = $link->getSshConnection();
        $userId = $user->getId();

        return [
            'id' => $link->getId(),
            'kind' => $link->getKind(),
            'name' => $link->getName(),
            'host' => $link->getHost(),
            'port' => $link->getPort(),
            'username' => $link->getUsername(),
            'has_secret' => '' !== $link->getSecret(),
            'driver' => $link->getDriver(),
            'database_name' => $link->getDatabaseName(),
            'listen_port' => $link->getListenPort(),
            'target_host' => $link->getTargetHost(),
            'target_port' => $link->getTargetPort(),
            'ssh_connection_id' => $ssh?->getId(),
            'running' => null !== $userId && 'tunnel' === $link->getKind() && $this->tunnels->isRunning($userId, (int) $link->getId()),
        ];
    }
}
