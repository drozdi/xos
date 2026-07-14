<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/device')]
class DeviceLegacyRedirectController extends AbstractController
{
    #[Route('/{path}', name: 'device_legacy_redirect', requirements: ['path' => '.+'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], priority: -100)]
    public function redirectLegacy(string $path, Request $request): RedirectResponse
    {
        $target = '/api/device/'.$path;
        $queryString = $request->getQueryString();
        if (null !== $queryString && '' !== $queryString) {
            $target .= '?'.$queryString;
        }

        $response = new RedirectResponse($target, Response::HTTP_PERMANENTLY_REDIRECT);
        $response->headers->set('Deprecation', 'true');
        $response->headers->set('Link', sprintf('</api/device/%s>; rel="successor-version"', $path));

        return $response;
    }
}
