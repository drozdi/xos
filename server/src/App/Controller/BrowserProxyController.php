<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/browser')]
class BrowserProxyController extends AbstractController
{
    #[Route('/proxy', methods: ['GET'])]
    public function proxy(Request $request): Response
    {
        $url = trim($request->query->getString('url'));
        if (!$this->isAllowedUrl($url)) {
            return new JsonResponse(['message' => 'Недопустимый URL'], Response::HTTP_BAD_REQUEST);
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", [
                    'User-Agent: Mozilla/5.0 (compatible; XOS-Browser/1.0)',
                    'Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                ]),
                'follow_location' => 1,
                'max_redirects' => 5,
                'timeout' => 20,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $content = @file_get_contents($url, false, $context);
        if ($content === false) {
            return new JsonResponse(['message' => 'Не удалось загрузить страницу'], Response::HTTP_BAD_GATEWAY);
        }

        $statusCode = $this->resolveStatusCode($http_response_header ?? []);
        if ($statusCode >= 400) {
            return new JsonResponse(
                ['message' => sprintf('Сервер вернул ошибку %d', $statusCode)],
                Response::HTTP_BAD_GATEWAY,
            );
        }

        $contentType = $this->resolveContentType($http_response_header ?? []);
        if (!str_contains(strtolower($contentType), 'text/html')) {
            return new JsonResponse(
                ['message' => 'Поддерживаются только HTML-страницы'],
                Response::HTTP_UNSUPPORTED_MEDIA_TYPE,
            );
        }

        $html = $this->injectBaseTag($content, $url);

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html; charset=UTF-8',
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

        $host = strtolower($parts['host'] ?? '');
        if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true)) {
            return false;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $packed = inet_pton($host);
            if ($packed !== false && $this->isPrivateIp($packed)) {
                return false;
            }
        }

        return true;
    }

    private function isPrivateIp(string $packed): bool
    {
        if (strlen($packed) === 4) {
            $first = ord($packed[0]);
            $second = ord($packed[1]);

            return $first === 10
                || ($first === 172 && $second >= 16 && $second <= 31)
                || ($first === 192 && $second === 168)
                || $first === 127;
        }

        return str_starts_with($packed, "\xfe\x80")
            || str_starts_with($packed, "\xfc\x00")
            || str_starts_with($packed, "\xfd\x00");
    }

    /**
     * @param list<string> $headers
     */
    private function resolveContentType(array $headers): string
    {
        foreach ($headers as $header) {
            if (stripos($header, 'Content-Type:') === 0) {
                return trim(substr($header, strlen('Content-Type:')));
            }
        }

        return 'text/html';
    }

    /**
     * @param list<string> $headers
     */
    private function resolveStatusCode(array $headers): int
    {
        foreach ($headers as $header) {
            if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                return (int) $matches[1];
            }
        }

        return 200;
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
