<?php

namespace App\EventSubscriber;

use App\Attribute\Access;
use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

final class AccessSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly UserScopeResolver $userScopeResolver,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => ['onKernelController', 0],
        ];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        $controller = $event->getController();
        if (!is_array($controller)) {
            return;
        }

        [$controllerObject, $methodName] = $controller;
        $reflectionClass = new \ReflectionClass($controllerObject);
        $classAttributes = $reflectionClass->getAttributes(Access::class);
        if ([] === $classAttributes) {
            return;
        }

        $classScope = $classAttributes[0]->newInstance()->getApp();
        $method = $reflectionClass->getMethod($methodName);
        $methodAttributes = $method->getAttributes(Access::class);
        if ([] === $methodAttributes) {
            return;
        }

        $methodScope = $methodAttributes[0]->newInstance()->getApp();
        $fullScope = str_starts_with($methodScope, 'can_')
            ? $methodScope.'.'.$classScope
            : $methodScope;

        $token = $this->tokenStorage->getToken();
        $user = $token?->getUser();
        if (!$user instanceof User) {
            $event->setController(fn () => ApiResponse::forbidden('Требуется авторизация'));

            return;
        }

        if (!$this->userScopeResolver->checkHasScope($user, $fullScope)) {
            $event->setController(fn () => ApiResponse::forbidden('Недостаточно прав'));
        }
    }
}
