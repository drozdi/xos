<?php

namespace Rdp\Service;

use Main\Entity\User;
use Rdp\Entity\RdpNetwork;
use Rdp\Entity\RdpNode;
use Rdp\Repository\RdpNetworkRepository;
use Rdp\Repository\RdpNodeRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class RdpHostPolicy
{
    /** @var list<string> */
    private array $extraDeny;

    public function __construct(
        private readonly RdpNetworkRepository $networks,
        private readonly RdpNodeRepository $nodes,
        #[Autowire('%env(default::RDP_DENY_CIDRS)%')]
        ?string $denyCidrs = null,
    ) {
        $this->extraDeny = self::split($denyCidrs);
    }

    /**
     * @return array{zone: string, resolved_ip: string, network: RdpNetwork|null, node: RdpNode, network_name: string|null}
     */
    public function assertAllowed(User $user, string $host, string $declaredZone): array
    {
        $parsed = self::host($host);
        $decision = RdpAccessDecision::decide(
            $parsed['ips'],
            $parsed['internal_name'],
            $declaredZone,
            $this->granted($user),
            $this->extraDeny,
        );
        $network = null;
        if (null !== $decision['network_id']) {
            $found = $this->networks->find($decision['network_id']);
            $network = $found instanceof RdpNetwork ? $found : null;
        }
        $node = $network?->getNode() ?? $this->localNode();
        if (!$node->isActive()) {
            throw new ServiceUnavailableHttpException(null, 'Узел сети «'.$node->getName().'» недоступен');
        }

        return [
            'zone' => $decision['zone'],
            'resolved_ip' => $decision['resolved_ip'],
            'network' => $network,
            'node' => $node,
            'network_name' => $decision['network_name'],
        ];
    }

    /**
     * @return array{zone: string|null, network: string|null, allowed: bool, reason: string|null}
     */
    public function describe(User $user, string $host): array
    {
        try {
            $result = $this->assertAllowed($user, $host, 'auto');
        } catch (BadRequestHttpException $error) {
            return ['zone' => null, 'network' => null, 'allowed' => false, 'reason' => $error->getMessage()];
        } catch (ServiceUnavailableHttpException $error) {
            return ['zone' => null, 'network' => null, 'allowed' => false, 'reason' => $error->getMessage()];
        }

        return [
            'zone' => $result['zone'],
            'network' => $result['network_name'],
            'allowed' => true,
            'reason' => null,
        ];
    }

    /**
     * @return list<array{id: int, name: string, cidrs: list<string>}>
     */
    private function granted(User $user): array
    {
        $rows = [];
        foreach ($this->networks->findGranted($user) as $network) {
            $id = $network->getId();
            if (null === $id) {
                continue;
            }
            $rows[] = ['id' => $id, 'name' => $network->getName(), 'cidrs' => $network->getCidrs()];
        }

        return $rows;
    }

    private function localNode(): RdpNode
    {
        $node = $this->nodes->findLocal();
        if (!$node instanceof RdpNode) {
            throw new ServiceUnavailableHttpException(null, 'Локальный узел не создан');
        }

        return $node;
    }

    /**
     * @return array{ips: list<string>, internal_name: bool}
     */
    private static function host(string $value): array
    {
        $host = strtolower(trim($value));
        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            $host = substr($host, 1, -1);
        }
        if ('' === $host || strlen($host) > 253 || 1 === preg_match('/[\s\x00-\x1F]/', $host)) {
            throw new BadRequestHttpException('Хост заполнен неверно');
        }
        if (in_array($host, ['localhost', 'metadata.google.internal'], true)) {
            throw new BadRequestHttpException('Этот адрес недоступен');
        }
        $internal = str_ends_with($host, '.local') || str_ends_with($host, '.internal');
        if (false !== filter_var($host, FILTER_VALIDATE_IP)) {
            return ['ips' => [$host], 'internal_name' => $internal];
        }
        if (1 !== preg_match('/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/', $host)) {
            throw new BadRequestHttpException('Хост заполнен неверно');
        }
        $ips = [];
        foreach ([DNS_A, DNS_AAAA] as $type) {
            $records = @dns_get_record($host, $type);
            if (!is_array($records)) {
                continue;
            }
            foreach ($records as $record) {
                if (isset($record['ip']) && is_string($record['ip'])) {
                    $ips[] = $record['ip'];
                }
                if (isset($record['ipv6']) && is_string($record['ipv6'])) {
                    $ips[] = $record['ipv6'];
                }
            }
        }
        if ([] === $ips) {
            throw new BadRequestHttpException('Хост не резолвится');
        }

        return ['ips' => $ips, 'internal_name' => $internal];
    }

    /**
     * @return list<string>
     */
    private static function split(?string $value): array
    {
        if (null === $value || '' === trim($value)) {
            return [];
        }
        $items = [];
        foreach (explode(',', $value) as $item) {
            $item = trim($item);
            if ('' !== $item) {
                $items[] = $item;
            }
        }

        return $items;
    }
}
