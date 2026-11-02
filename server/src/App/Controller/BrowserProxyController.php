<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\NoPrivateNetworkHttpClient;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

#[Route('/api/browser')]
class BrowserProxyController extends AbstractController
{
    private const MAX_BYTES = 5 * 1024 * 1024;
    private const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https: http: data:; img-src https: http: data: blob:; font-src https: http: data:; media-src https: http:; connect-src https: http:; frame-src https: http:; base-uri https: http:; form-action https: http:; frame-ancestors 'none'";

    #[Route('/proxy', methods: ['GET'])]
    public function proxy(Request $request): Response
    {
        $url = trim($request->query->getString('url'));
        if (!$this->isAllowedUrl($url)) {
            return new JsonResponse(['message' => 'Недопустимый URL'], Response::HTTP_BAD_REQUEST);
        }

        $client = new NoPrivateNetworkHttpClient(HttpClient::create([
            'timeout' => 8,
            'max_redirects' => 3,
        ]));

        try {
            $response = $client->request('GET', $url, [
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (compatible; XOS-Browser/1.0)',
                    'Accept' => 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                ],
            ]);
            $statusCode = $response->getStatusCode();
        } catch (TransportExceptionInterface) {
            return new JsonResponse(['message' => 'Не удалось загрузить страницу'], Response::HTTP_BAD_GATEWAY);
        }

        if ($statusCode >= 400) {
            return new JsonResponse(
                ['message' => sprintf('Сервер вернул ошибку %d', $statusCode)],
                Response::HTTP_BAD_GATEWAY,
            );
        }

        $contentType = strtolower($response->getHeaders(false)['content-type'][0] ?? '');
        if (!str_contains($contentType, 'text/html')) {
            return new JsonResponse(
                ['message' => 'Поддерживаются только HTML-страницы'],
                Response::HTTP_UNSUPPORTED_MEDIA_TYPE,
            );
        }

        $content = '';
        foreach ($client->stream($response) as $chunk) {
            if ($chunk->isTimeout()) {
                continue;
            }
            $content .= $chunk->getContent();
            if (strlen($content) > self::MAX_BYTES) {
                $response->cancel();

                return new JsonResponse(['message' => 'Страница слишком большая'], Response::HTTP_BAD_GATEWAY);
            }
        }

        $html = $this->injectCsp($this->injectBaseTag($content, $url));

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Security-Policy' => self::CONTENT_SECURITY_POLICY,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function isAllowedUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $port = (int) ($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
        if (!in_array($port, [80, 443], true)) {
            return false;
        }

        $host = strtolower($parts['host'] ?? '');
        if ('' === $host || in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true)) {
            return false;
        }

        return true;
    }

    private function injectCsp(string $html): string
    {
        $meta = '<meta http-equiv="Content-Security-Policy" content="'.htmlspecialchars(self::CONTENT_SECURITY_POLICY, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'">';
        if (preg_match('/<head[^>]*>/i', $html, $matches, PREG_OFFSET_CAPTURE)) {
            $position = $matches[0][1] + strlen($matches[0][0]);

            return substr($html, 0, $position).$meta.substr($html, $position);
        }

        return '<head>'.$meta.'</head>'.$html;
    }

    private function injectBaseTag(string $html, string $url): string
    {
        $base = htmlspecialchars($this->resolveBaseHref($url), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $tag = '<base href="'.$base.'">';

        if (preg_match('/<head[^>]*>/i', $html, $matches, PREG_OFFSET_CAPTURE)) {
            $position = $matches[0][1] + strlen($matches[0][0]);

            return substr($html, 0, $position).$tag.substr($html, $position);
        }

        if (preg_match('/<html[^>]*>/i', $html, $matches, PREG_OFFSET_CAPTURE)) {
            $position = $matches[0][1] + strlen($matches[0][0]);

            return substr($html, 0, $position).'<head>'.$tag.'</head>'.substr($html, $position);
        }

        return '<head>'.$tag.'</head>'.$html;
    }

    private function resolveBaseHref(string $url): string
    {
        $parts = parse_url($url);
        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $path = $parts['path'] ?? '/';

        if (!str_ends_with($path, '/')) {
            $directory = strrpos($path, '/');
            $path = false === $directory ? '/' : substr($path, 0, $directory + 1);
        }

        return $scheme.'://'.$host.$port.$path;
    }
}
