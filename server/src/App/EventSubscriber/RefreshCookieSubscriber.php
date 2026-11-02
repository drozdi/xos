<?php

namespace App\EventSubscriber;

use App\Security\RefreshCookie;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/** Moves refresh tokens out of JSON into an HttpOnly cookie. */
final class RefreshCookieSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RefreshCookie $refreshCookie,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onResponse',
        ];
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        if (!$response instanceof JsonResponse) {
            return;
        }

        $path = $event->getRequest()->getPathInfo();
        if (!str_contains($path, '/login') && !str_contains($path, '/token/refresh')) {
            return;
        }

        $data = json_decode($response->getContent(), true);
        if (!is_array($data) || !isset($data['refresh_token']) || !is_string($data['refresh_token']) || '' === $data['refresh_token']) {
            return;
        }

        $this->refreshCookie->attach($response, $event->getRequest(), $data['refresh_token']);
        unset($data['refresh_token']);
        $response->setData($data);
    }
}
