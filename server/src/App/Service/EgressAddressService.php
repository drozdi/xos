<?php

namespace App\Service;

use Psr\Cache\CacheItemPoolInterface;

class EgressAddressService
{
    private const CACHE_KEY = 'network.egress_ip';
    private const TTL_SECONDS = 600;

    public function __construct(
        private readonly CacheItemPoolInterface $cache,
    ) {
    }

    public function get(): ?string
    {
        $item = $this->cache->getItem(self::CACHE_KEY);
        if ($item->isHit()) {
            $cached = $item->get();

            return \is_string($cached) && '' !== $cached ? $cached : null;
        }

        $ip = $this->fetchPublicIp();
        if (null === $ip) {
            return null;
        }

        $item->set($ip);
        $item->expiresAfter(self::TTL_SECONDS);
        $this->cache->save($item);

        return $ip;
    }

    private function fetchPublicIp(): ?string
    {
        $context = stream_context_create([
            'http' => [
                'timeout' => 2,
                'header' => "Accept: text/plain\r\n",
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents('https://api.ipify.org', false, $context);
        if (!\is_string($body)) {
            return null;
        }

        $ip = trim($body);
        if (false === filter_var($ip, FILTER_VALIDATE_IP)) {
            return null;
        }

        return $ip;
    }
}
