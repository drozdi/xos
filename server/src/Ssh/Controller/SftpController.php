<?php

namespace Ssh\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ssh\Exception\SshHostKeyMismatch;
use Ssh\Service\SftpBrowser;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ssh/sftp', name: 'api_ssh_sftp_')]
#[Access('ssh', checkScopes: false)]
class SftpController extends AbstractController
{
    public function __construct(private readonly SftpBrowser $browser)
    {
    }

    #[Route('/list', name: 'list', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $data = $this->body($request);

        return $this->call($user, function (User $owner) use ($data): array {
            return $this->browser->list($owner, $this->id($data), (string) ($data['path'] ?? ''), $this->accept($data));
        });
    }

    #[Route('/download', name: 'download', methods: ['GET'])]
    #[Access('ssh', checkScopes: false)]
    public function download(Request $request, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        $data = $request->query->all();
        try {
            $body = $this->browser->download($user, $this->id($data), (string) ($data['path'] ?? ''), $this->accept($data));
        } catch (SshHostKeyMismatch $error) {
            return $this->hostKey($error);
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }
        $name = basename(str_replace('\\', '/', (string) ($data['path'] ?? 'file')));
        if ('' === $name || '.' === $name || '..' === $name) {
            $name = 'file';
        }

        return new Response($body, Response::HTTP_OK, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $name),
            'Cache-Control' => 'no-store',
        ]);
    }

    #[Route('/upload', name: 'upload', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function upload(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $file = $request->files->get('file');

        return $this->call($user, function (User $owner) use ($request, $file): array {
            if (!$file instanceof UploadedFile) {
                throw new BadRequestHttpException('Файл не загружен');
            }
            $data = $request->request->all();
            $this->browser->upload($owner, $this->id($data), (string) ($data['path'] ?? ''), $file, $this->accept($data));

            return ['ok' => true];
        });
    }

    #[Route('/mkdir', name: 'mkdir', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function mkdir(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $data = $this->body($request);

        return $this->call($user, function (User $owner) use ($data): array {
            $this->browser->mkdir($owner, $this->id($data), (string) ($data['path'] ?? ''), (string) ($data['name'] ?? ''), $this->accept($data));

            return ['ok' => true];
        });
    }

    #[Route('/remove', name: 'remove', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function remove(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $data = $this->body($request);

        return $this->call($user, function (User $owner) use ($data): array {
            $this->browser->remove($owner, $this->id($data), (string) ($data['path'] ?? ''), $this->accept($data));

            return ['ok' => true];
        });
    }

    #[Route('/rename', name: 'rename', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function rename(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $data = $this->body($request);

        return $this->call($user, function (User $owner) use ($data): array {
            $this->browser->rename($owner, $this->id($data), (string) ($data['path'] ?? ''), (string) ($data['name'] ?? ''), $this->accept($data));

            return ['ok' => true];
        });
    }

    /**
     * @param callable(User): array<string, mixed> $fn
     */
    private function call(?User $user, callable $fn): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            return $this->json($fn($user));
        } catch (SshHostKeyMismatch $error) {
            return $this->hostKey($error);
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }

    private function hostKey(SshHostKeyMismatch $error): JsonResponse
    {
        return $this->json([
            'message' => $error->getMessage(),
            'code' => 'host_key',
            'fingerprint' => $error->fingerprint,
        ], Response::HTTP_CONFLICT);
    }

    /**
     * @return array<string, mixed>
     */
    private function body(Request $request): array
    {
        try {
            $data = $request->toArray();
        } catch (\Throwable) {
            throw new BadRequestHttpException('Пустой запрос');
        }

        return $data;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function id(array $data): int
    {
        $id = $data['connection_id'] ?? null;
        if (!is_int($id) && !(is_string($id) && ctype_digit($id))) {
            throw new BadRequestHttpException('Подключение не указано');
        }

        return (int) $id;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function accept(array $data): bool
    {
        return true === ($data['accept_host_key'] ?? false) || '1' === (string) ($data['accept_host_key'] ?? '');
    }
}
