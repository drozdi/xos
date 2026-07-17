<?php

namespace Main\Controller;

use Main\Service\FileManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/main/file')]
class FileController extends AbstractController
{
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
}
