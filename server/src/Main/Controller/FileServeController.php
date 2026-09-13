<?php

namespace Main\Controller;

use Main\Service\UploadPathResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/uploads')]
class FileServeController extends AbstractController
{
    /** Modules that must not be served via public /uploads (use JWT API instead). */
    private const BLOCKED_MODULES = ['task'];

    public function __construct(
        private readonly string $uploadDir,
        private readonly UploadPathResolver $uploadPathResolver,
    ) {
    }

    #[Route('/{module}/{subDir}/{fileName}', requirements: ['subDir' => '.+'], methods: ['GET'])]
    public function serve(string $module, string $subDir, string $fileName): BinaryFileResponse
    {
        if (in_array($module, self::BLOCKED_MODULES, true)) {
            throw new AccessDeniedHttpException('Direct download of this module is forbidden');
        }

        $path = $this->uploadPathResolver->resolveReadablePath(
            $this->uploadDir,
            $module,
            $subDir,
            $fileName,
        );

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $fileName);

        return $response;
    }
}
