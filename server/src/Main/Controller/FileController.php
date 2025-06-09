<?php

namespace Main\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

use Main\Service\FileManager;

#[Route('/main/file')]
class FileController extends AbstractController {
    #[Route('/upload', name: 'main_file_upload', methods: ['POST'])]
    public function upload (Request $request, FileManager $fm): JsonResponse {

    }
}