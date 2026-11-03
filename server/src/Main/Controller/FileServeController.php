<?php

namespace Main\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\File as MainFile;
use Main\Entity\User;
use Main\Service\FileAccess;
use Main\Service\SharedFileRead;
use Main\Service\UploadPathResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/uploads')]
class FileServeController extends AbstractController
{
    /** Modules that must not be served via public /uploads (use JWT API instead). */
    private const BLOCKED_MODULES = ['task'];

    public function __construct(
        private readonly string $uploadDir,
        private readonly UploadPathResolver $uploadPathResolver,
        private readonly EntityManagerInterface $entityManager,
        private readonly FileAccess $fileAccess,
        private readonly SharedFileRead $sharedFileRead,
    ) {
    }

    #[Route('/{module}/{subDir}/{fileName}', requirements: ['subDir' => '.+'], methods: ['GET'])]
    public function serve(string $module, string $subDir, string $fileName, #[CurrentUser] ?User $user): BinaryFileResponse
    {
        if (in_array($module, self::BLOCKED_MODULES, true)) {
            throw new AccessDeniedHttpException('Direct download of this module is forbidden');
        }

        $file = $this->entityManager->getRepository(MainFile::class)->findOneBy([
            'module' => $module,
            'subDir' => $subDir,
            'fileName' => $fileName,
        ]);
        if (!$file instanceof MainFile || (!$this->fileAccess->canRead($file, $user) && !$this->sharedFileRead->canRead($file, $user))) {
            throw new NotFoundHttpException('File not found');
        }

        $path = $this->uploadPathResolver->resolveReadablePath(
            $this->uploadDir,
            $module,
            $subDir,
            $fileName,
        );

        $response = new BinaryFileResponse($path);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $file->getOriginalName() ?: $fileName);

        return $response;
    }
}
