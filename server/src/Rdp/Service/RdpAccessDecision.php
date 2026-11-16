<?php

namespace Rdp\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Pure allow/deny decision after DNS has produced addresses. */
final class RdpAccessDecision
{
    /**
     * @param list<string>                                            $ips
     * @param list<array{id: int, name: string, cidrs: list<string>}> $networks
     * @param list<string>                                            $extraDeny
     *
     * @return array{zone: string, resolved_ip: string, network_id: int|null, network_name: string|null}
     */
    public static function decide(array $ips, bool $internalName, string $declaredZone, array $networks, array $extraDeny = []): array
    {
        if (!in_array($declaredZone, ['auto', 'public', 'internal'], true)) {
            throw new BadRequestHttpException('Зона заполнена неверно');
        }
        if ([] === $ips) {
            throw new BadRequestHttpException('Хост не резолвится');
        }
        $normalized = [];
        foreach ($ips as $ip) {
            $normalized[] = CidrMatcher::normalizeIp($ip);
        }
        $normalized = array_values(array_unique($normalized));
        foreach ($normalized as $ip) {
            if (CidrMatcher::isDenied($ip, $extraDeny)) {
                throw new BadRequestHttpException('Этот адрес недоступен');
            }
        }
        $private = [];
        $public = [];
        foreach ($normalized as $ip) {
            if (CidrMatcher::isPrivate($ip)) {
                $private[] = $ip;
            } else {
                $public[] = $ip;
            }
        }
        if ([] !== $private && [] !== $public) {
            throw new BadRequestHttpException('Имя указывает и в интернет, и во внутреннюю сеть');
        }
        $internal = $internalName || [] !== $private;
        if (!$internal) {
            self::expectZone($declaredZone, 'public', $normalized[0]);

            return [
                'zone' => 'public',
                'resolved_ip' => $normalized[0],
                'network_id' => null,
                'network_name' => null,
            ];
        }
        $best = null;
        $bestPrefix = -1;
        $resolved = null;
        foreach ($normalized as $ip) {
            foreach ($networks as $network) {
                foreach ($network['cidrs'] as $cidr) {
                    if (!CidrMatcher::contains($cidr, $ip)) {
                        continue;
                    }
                    $prefix = CidrMatcher::prefix($cidr);
                    if ($prefix > $bestPrefix) {
                        $bestPrefix = $prefix;
                        $best = $network;
                        $resolved = $ip;
                    }
                }
            }
        }
        if (null === $best || null === $resolved) {
            throw new BadRequestHttpException('Хост во внутренней сети недоступен');
        }
        self::expectZone($declaredZone, 'internal', $resolved);

        return [
            'zone' => 'internal',
            'resolved_ip' => $resolved,
            'network_id' => $best['id'],
            'network_name' => $best['name'],
        ];
    }

    private static function expectZone(string $declared, string $detected, string $ip): void
    {
        if ('auto' === $declared || $declared === $detected) {
            return;
        }
        $label = 'internal' === $detected ? 'внутренней сети' : 'интернету';

        throw new BadRequestHttpException('Хост '.$ip.' относится к '.$label);
    }
}
