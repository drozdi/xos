<?php

namespace App\Security;

use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Request\Extractor\ExtractorInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Http\Event\LogoutEvent;

class LogoutHandler implements EventSubscriberInterface
{
    public function __construct(
        private readonly RefreshTokenManagerInterface $refreshTokenManager,
        private readonly ExtractorInterface $refreshTokenExtractor,
        #[Autowire('%gesdinet_jwt_refresh_token.token_parameter_name%')]
        private readonly string $tokenParameterName,
        #[Autowire('%gesdinet_jwt_refresh_token.logout_firewall_context%')]
        private readonly string $logoutFirewallContext,
    ) {
    }

    public function onLogout(LogoutEvent $event): void
    {
        if ($event->getRequest()->attributes->get('_firewall_context') !== $this->logoutFirewallContext) {
            return;
        }

        $this->invalidateRefreshTokens($event);

        $event->setResponse(new JsonResponse(['status' => 'logged_out']));
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LogoutEvent::class => ['onLogout', 64],
        ];
    }

    private function invalidateRefreshTokens(LogoutEvent $event): void
    {
        $request = $event->getRequest();
        $tokenString = $this->refreshTokenExtractor->getRefreshToken($request, $this->tokenParameterName);

        if (null !== $tokenString) {
            $refreshToken = $this->refreshTokenManager->get($tokenString);
            if ($refreshToken instanceof RefreshTokenInterface) {
                $this->refreshTokenManager->delete($refreshToken);
            }

            return;
        }

        $user = $event->getToken()?->getUser();
        if (!$user instanceof UserInterface) {
            return;
        }

        $username = method_exists($user, 'getUserIdentifier')
            ? $user->getUserIdentifier()
            : (string) $user;

        while ($refreshToken = $this->refreshTokenManager->getLastFromUsername($username)) {
            $this->refreshTokenManager->delete($refreshToken);
        }
    }
}
