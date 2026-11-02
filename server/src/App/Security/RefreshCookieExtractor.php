<?php

namespace App\Security;

use Gesdinet\JWTRefreshTokenBundle\Request\Extractor\ExtractorInterface;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;
use Symfony\Component\HttpFoundation\Request;

#[AutoconfigureTag('gesdinet_jwt_refresh_token.request_extractor', ['priority' => 10])]
final class RefreshCookieExtractor implements ExtractorInterface
{
    public function __construct(
        private readonly RefreshCookie $refreshCookie,
    ) {
    }

    public function getRefreshToken(Request $request, string $parameter): ?string
    {
        return $this->refreshCookie->read($request);
    }
}
