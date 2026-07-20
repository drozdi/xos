<?php

namespace Main\Controller;

use Main\Service\UploadPathResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/uploads')]
class FileServeController extends AbstractController
{
    public function __construct(
        private readonly string $uploadDir,
        private readonly UploadPathResolver $uploadPathResolver,
    ) {
    }

    #[Route('/{module}/{subDir}/{fileName}', requirements: ['subDir' => '.+'], methods: ['GET'])]
    public function serve(string $module, string $subDir, string $fileName): BinaryFileResponse
    {
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
