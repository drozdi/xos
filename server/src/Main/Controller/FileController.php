<?php

namespace Main\Controller;

use Main\Entity\File as MainFile;
use Main\Service\FileManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/main/file')]
class FileController extends AbstractController
{
    /** Same as FileServeController — use dedicated download APIs for these modules. */
    private const BLOCKED_MODULES = ['task'];

    #[Route('/upload', name: 'main_file_upload', methods: ['POST'])]
    public function upload(Request $request, FileManager $fm): JsonResponse
    {
        $payload = $request->request->count() > 0 ? $request->request->all() : $request->toArray();
        $module = (string) ($payload['module'] ?? 'common');
        $field = (string) ($payload['field'] ?? 'file');
        $subDir = isset($payload['subDir']) && is_string($payload['subDir']) && '' !== $payload['subDir']
            ? $payload['subDir']
            : null;

        $files = $fm->upload($field, $module, null, $subDir);
        $items = [];
        foreach ($files as $file) {
            $items[] = [
                'id' => $file->getId(),
                'name' => $file->getOriginalName(),
                'src' => $file->getFileSRC(),
            ];
        }

        return $this->json($items, Response::HTTP_CREATED);
    }

    /**
     * Authenticated file stream (Bearer). Use for <img> via blob URL — /uploads requires JWT
     * which browsers do not send on plain image requests.
     */
    #[Route('/{id}', name: 'main_file_download', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function download(int $id, FileManager $fm): BinaryFileResponse
    {
        $file = $fm->getFileRepository()?->find($id);
        if (!$file instanceof MainFile) {
            throw new NotFoundHttpException(sprintf('File #%d not found', $id));
        }
        if (\in_array($file->getModule(), self::BLOCKED_MODULES, true)) {
            throw new AccessDeniedHttpException('Direct download of this module is forbidden');
        }

        $path = $fm->resolveAbsolutePath($file);
        $response = new BinaryFileResponse($path);
        $mime = $file->getContentType();
        if ('' !== $mime) {
            $response->headers->set('Content-Type', $mime);
        }
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            (string) $file->getOriginalName(),
        );

        return $response;
    }
}
