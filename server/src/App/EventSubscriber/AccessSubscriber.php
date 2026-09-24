<?php

namespace App\EventSubscriber;

use App\Attribute\Access;
use App\Http\ApiResponse;
use App\Security\RecipeIblockBridge;
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
        private readonly RecipeIblockBridge $recipeIblockBridge,
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

        $classAccess = $classAttributes[0]->newInstance();
        $method = $reflectionClass->getMethod($methodName);
        $methodAttributes = $method->getAttributes(Access::class);
        if ([] === $methodAttributes) {
            return;
        }

        $methodAccess = $methodAttributes[0]->newInstance();
        if (!$classAccess->checksRoles() && !$classAccess->checksScopes()
            && !$methodAccess->checksRoles() && !$methodAccess->checksScopes()) {
            return;
        }

        $classScope = $classAccess->getApp();
        $methodScope = $methodAccess->getApp();
        $fullScope = str_starts_with($methodScope, 'can_')
            ? $methodScope.'.'.$classScope
            : $methodScope;

        $token = $this->tokenStorage->getToken();
        $user = $token?->getUser();
        if (!$user instanceof User) {
            $event->setController(fn () => ApiResponse::forbidden('Требуется авторизация'));

            return;
        }

        $checkRoles = $classAccess->checksRoles() || $methodAccess->checksRoles();
        $checkScopes = $methodAccess->checksScopes();
        $module = explode('.', $classScope)[0];

        $hasModule = !$checkRoles || $this->userScopeResolver->canAccessModule($user, $module);
        if ($hasModule) {
            if ($checkScopes && !$this->userScopeResolver->checkHasScope($user, $fullScope)) {
                $event->setController(fn () => ApiResponse::forbidden('Недостаточно прав'));
            }

            return;
        }

        // ROLE_RECIPE → IBlock controllers for recipes catalog (scopes mapped in bridge)
        if ($this->recipeIblockBridge->allowsIblockAccess($user, $classScope, $fullScope, $checkScopes)) {
            return;
        }

        $event->setController(fn () => ApiResponse::forbidden('Недостаточно прав'));
    }
}
