<?php

namespace App\EventListener;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 30)]
final class PublicEndpointRateLimitListener
{
    public function __construct(
        #[Autowire(service: 'limiter.public_api')]
        private readonly RateLimiterFactory $limiter,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!\in_array($request->getMethod(), ['POST', 'PUT', 'GET'], true)) {
            return;
        }
        if (!$this->isLimitedPath($request->getPathInfo())) {
            return;
        }

        $limit = $this->limiter->create($request->getClientIp() ?? 'unknown')->consume();
        if ($limit->isAccepted()) {
            return;
        }

        $event->setResponse(new Response('Too Many Requests', Response::HTTP_TOO_MANY_REQUESTS));
    }

    private function isLimitedPath(string $path): bool
    {
        if (1 === preg_match('#^/api/IncCom/auth/register$#', $path)) {
            return true;
        }
        if (1 === preg_match('#^/api/browser/proxy$#', $path)) {
            return true;
        }
        if (1 === preg_match('#^/api/token/refresh$#', $path)) {
            return true;
        }
        if (1 === preg_match('#^/api/(calendar|IncCom|schooltask)/token/refresh$#', $path)) {
            return true;
        }

        return 1 === preg_match('#/upload$#', $path);
    }
}
