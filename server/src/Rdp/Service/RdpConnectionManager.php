<?php

namespace Rdp\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Service\AuditLogger;
use Rdp\Entity\RdpConnection;
use Rdp\Repository\RdpConnectionRepository;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RdpConnectionManager
{
    public function __construct(
        private readonly RdpConnectionRepository $connections,
        private readonly EntityManagerInterface $entityManager,
        private readonly SshSecretCipher $cipher,
        private readonly RdpHostPolicy $policy,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $user): array
    {
        return array_map($this->serialize(...), $this->connections->findForUser($user));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function create(User $user, array $data): array
    {
        $payload = RdpConnectionPayload::parse($data, true);
        $access = $this->policy->assertAllowed($user, $payload['host'], $payload['zone']);
        $connection = new RdpConnection($user);
        $this->apply($connection, $payload, $access, true);
        $this->entityManager->persist($connection);
        $this->entityManager->flush();
        $this->audit->log('rdp.connection.create', 'rdp_connection', $connection->getId(), $connection->getName(), [
            'host' => $connection->getHost(),
            'zone' => $access['zone'],
            'network' => $access['network_name'],
        ], $user);

        return $this->serialize($connection);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function update(User $user, int $id, array $data): array
    {
        $connection = $this->require($user, $id);
        $payload = RdpConnectionPayload::parse($data, false);
        $access = $this->policy->assertAllowed($user, $payload['host'], $payload['zone']);
        $this->apply($connection, $payload, $access, false);
        $this->entityManager->flush();
        $this->audit->log('rdp.connection.update', 'rdp_connection', $connection->getId(), $connection->getName(), [
            'host' => $connection->getHost(),
            'zone' => $access['zone'],
        ], $user);

        return $this->serialize($connection);
    }

    public function delete(User $user, int $id): void
    {
        $connection = $this->require($user, $id);
        $this->entityManager->remove($connection);
        $this->entityManager->flush();
        $this->audit->log('rdp.connection.delete', 'rdp_connection', $id, $connection->getName(), null, $user);
    }

    public function require(User $user, int $id): RdpConnection
    {
        $connection = $this->connections->findOneForUser($user, $id);
        if (!$connection instanceof RdpConnection) {
            throw new NotFoundHttpException('Подключение не найдено');
        }

        return $connection;
    }

    /**
     * @param array<string, mixed>                                                                                                                 $payload
     * @param array{zone: string, resolved_ip: string, network: \Rdp\Entity\RdpNetwork|null, node: \Rdp\Entity\RdpNode, network_name: string|null} $access
     */
    private function apply(RdpConnection $connection, array $payload, array $access, bool $isNew): void
    {
        $clipboard = $payload['enable_clipboard'];
        $drive = $payload['enable_drive'];
        $network = $access['network'];
        if (null !== $network && !$network->allowsClipboard()) {
            $clipboard = false;
        }
        if (null !== $network && !$network->allowsDrive()) {
            $drive = false;
        }
        $connection
            ->setName($payload['name'])
            ->setHost($payload['host'])
            ->setPort($payload['port'])
            ->setZone($payload['zone'])
            ->setZoneDetected($access['zone'])
            ->setNetwork($network)
            ->setNode($access['node'])
            ->setUsername($payload['username'])
            ->setDomain($payload['domain'])
            ->setSecurity($payload['security'])
            ->setIgnoreCert($payload['ignore_cert'])
            ->setWidth($payload['width'])
            ->setHeight($payload['height'])
            ->setDpi($payload['dpi'])
            ->setColorDepth($payload['color_depth'])
            ->setEnableClipboard($clipboard)
            ->setEnableAudio($payload['enable_audio'])
            ->setEnableDrive($drive)
            ->setKeyboardLayout($payload['keyboard_layout'])
            ->setResizeMethod($payload['resize_method']);
        if (is_string($payload['secret'])) {
            $connection->setSecret($this->cipher->encrypt($payload['secret']));
        } elseif ($isNew) {
            throw new BadRequestHttpException('Укажите пароль');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(RdpConnection $connection): array
    {
        $network = $connection->getNetwork();
        $reachable = null === $network || ($network->isActive() && (null === $network->getNode() || $network->getNode()->isActive()));

        return [
            'id' => $connection->getId(),
            'name' => $connection->getName(),
            'host' => $connection->getHost(),
            'port' => $connection->getPort(),
            'zone' => $connection->getZone(),
            'zone_detected' => $connection->getZoneDetected(),
            'network_id' => $network?->getId(),
            'network_name' => $network?->getName(),
            'reachable' => $reachable,
            'username' => $connection->getUsername(),
            'domain' => $connection->getDomain(),
            'has_secret' => '' !== $connection->getSecret(),
            'security' => $connection->getSecurity(),
            'ignore_cert' => $connection->ignoresCert(),
            'cert_fingerprint' => $connection->getCertFingerprint(),
            'width' => $connection->getWidth(),
            'height' => $connection->getHeight(),
            'dpi' => $connection->getDpi(),
            'color_depth' => $connection->getColorDepth(),
            'enable_clipboard' => $connection->enablesClipboard(),
            'enable_audio' => $connection->enablesAudio(),
            'enable_drive' => $connection->enablesDrive(),
            'keyboard_layout' => $connection->getKeyboardLayout(),
            'resize_method' => $connection->getResizeMethod(),
        ];
    }
}
