<?php

namespace Ops\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ops\Service\OpsLinkManager;
use Ops\Service\VncClient;
use Ssh\Service\SshSecretCipher;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ops/vnc', name: 'api_ops_vnc_')]
#[Access('ssh', checkScopes: false)]
class VncController extends AbstractController
{
    public function __construct(
        private readonly OpsLinkManager $links,
        private readonly VncClient $client,
        private readonly SshSecretCipher $cipher,
    ) {
    }

    #[Route('/{id}/frame', name: 'frame', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function frame(int $id, Request $request, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $data = $request->toArray();
            $link = $this->links->require($user, 'vnc', $id);
            $png = $this->client->frame(
                $link->getHost(),
                $link->getPort(),
                '' === $link->getSecret() ? '' : $this->cipher->decrypt($link->getSecret()),
                $this->coord($data['x'] ?? null),
                $this->coord($data['y'] ?? null),
                $this->button($data['button'] ?? null),
                $this->key($data['key'] ?? null),
            );
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }

        return new Response($png, Response::HTTP_OK, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function coord(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Координата заполнена неверно');
        }

        return (int) $value;
    }

    private function button(mixed $value): int
    {
        if (null === $value || '' === $value || false === $value) {
            return 0;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Кнопка заполнена неверно');
        }
        $button = (int) $value;

        return \in_array($button, [0, 1, 2, 4], true) ? $button : 0;
    }

    private function key(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Клавиша заполнена неверно');
        }
        $key = (int) $value;
        if ($key < 1 || $key > 0xFFFFFF) {
            throw new BadRequestHttpException('Клавиша заполнена неверно');
        }

        return $key;
    }
}
