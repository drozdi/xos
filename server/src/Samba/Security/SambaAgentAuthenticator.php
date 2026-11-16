<?php

namespace Samba\Security;

use Samba\Service\SambaAgentService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class SambaAgentAuthenticator extends AbstractAuthenticator
{
    public function __construct(private readonly SambaAgentService $agents)
    {
    }

    public function supports(Request $request): ?bool
    {
        return str_starts_with($request->getPathInfo(), '/api/samba/agent/')
            && !str_ends_with($request->getPathInfo(), '/enroll');
    }

    public function authenticate(Request $request): Passport
    {
        $header = (string) $request->headers->get('Authorization', '');
        if (!str_starts_with($header, 'Bearer ')) {
            throw new CustomUserMessageAuthenticationException('Секрет агента не указан');
        }
        $secret = trim(substr($header, 7));
        $server = $this->agents->authenticate($secret);
        if (null === $server) {
            throw new CustomUserMessageAuthenticationException('Секрет агента недействителен');
        }

        return new SelfValidatingPassport(new UserBadge($secret, static fn (): SambaAgentIdentity => new SambaAgentIdentity($server)));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(['message' => 'Секрет агента недействителен'], Response::HTTP_UNAUTHORIZED);
    }
}
