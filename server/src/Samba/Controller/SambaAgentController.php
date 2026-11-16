<?php

namespace Samba\Controller;

use Samba\Security\SambaAgentIdentity;
use Samba\Service\SambaAgentBundle;
use Samba\Service\SambaAgentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/samba/agent')]
final class SambaAgentController extends AbstractController
{
    public function __construct(
        private readonly SambaAgentService $agents,
        private readonly SambaAgentBundle $bundle,
    ) {
    }

    #[Route('/bundle', name: 'api_samba_agent_bundle', methods: ['POST'])]
    public function bundle(Request $request): Response
    {
        try {
            $data = $request->toArray();
            $serverId = $data['server_id'] ?? null;
            if (!is_int($serverId) && !(is_string($serverId) && ctype_digit((string) $serverId))) {
                return $this->json(['message' => 'Сервер не указан'], Response::HTTP_BAD_REQUEST);
            }
            $credentials = $this->credentialsFromRequest($request, $data);
            $body = $this->bundle->build(
                $credentials['login'],
                $credentials['password'],
                (int) $serverId,
                $request->getSchemeAndHttpHost(),
            );
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }

        return new Response($body, Response::HTTP_OK, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="xos-agent.zip"',
        ]);
    }

    #[Route('/enroll', name: 'api_samba_agent_enroll', methods: ['POST'])]
    public function enroll(Request $request): JsonResponse
    {
        try {
            return $this->json($this->agents->enroll($request->toArray()));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/heartbeat', name: 'api_samba_agent_heartbeat', methods: ['POST'])]
    public function heartbeat(Request $request, #[CurrentUser] ?SambaAgentIdentity $agent): JsonResponse
    {
        if (!$agent instanceof SambaAgentIdentity) {
            return $this->json(['message' => 'Секрет агента недействителен'], Response::HTTP_UNAUTHORIZED);
        }
        try {
            return $this->json($this->agents->heartbeat($agent->getServer(), $request->toArray()));
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/poll', name: 'api_samba_agent_poll', methods: ['GET'])]
    public function poll(#[CurrentUser] ?SambaAgentIdentity $agent): JsonResponse
    {
        if (!$agent instanceof SambaAgentIdentity) {
            return $this->json(['message' => 'Секрет агента недействителен'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->agents->poll($agent->getServer()));
    }

    #[Route('/result', name: 'api_samba_agent_result', methods: ['POST'])]
    public function result(Request $request, #[CurrentUser] ?SambaAgentIdentity $agent): JsonResponse
    {
        if (!$agent instanceof SambaAgentIdentity) {
            return $this->json(['message' => 'Секрет агента недействителен'], Response::HTTP_UNAUTHORIZED);
        }
        try {
            $this->agents->result($agent->getServer(), $request->toArray());
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{login: string, password: string}
     */
    private function credentialsFromRequest(Request $request, array $data): array
    {
        $login = trim((string) ($data['login'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $basic = $this->basicCredentials($request);
        if ('' === $login) {
            $login = $basic['login'];
        }
        if ('' === $password) {
            $password = $basic['password'];
        }

        return ['login' => $login, 'password' => $password];
    }

    /**
     * @return array{login: string, password: string}
     */
    private function basicCredentials(Request $request): array
    {
        $login = $request->server->get('PHP_AUTH_USER');
        $password = $request->server->get('PHP_AUTH_PW');
        if (is_string($login) && '' !== $login) {
            return ['login' => trim($login), 'password' => is_string($password) ? $password : ''];
        }

        $header = (string) $request->headers->get('Authorization', '');
        if (!str_starts_with($header, 'Basic ')) {
            return ['login' => '', 'password' => ''];
        }
        $decoded = base64_decode(substr($header, 6), true);
        if (!is_string($decoded) || !str_contains($decoded, ':')) {
            return ['login' => '', 'password' => ''];
        }
        [$user, $pass] = explode(':', $decoded, 2);

        return ['login' => trim($user), 'password' => $pass];
    }
}
