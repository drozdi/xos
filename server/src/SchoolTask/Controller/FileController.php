<?php

namespace SchoolTask\Controller;

use Main\Entity\User;
use SchoolTask\Security\SchoolTaskAccessMessages;
use SchoolTask\Service\EventManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/schooltask/files')]
class FileController extends AbstractController
{
    #[Route('/{id}/download', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function download(
        int $id,
        Request $request,
        EventManager $eventManager,
        #[CurrentUser] ?User $user,
    ): BinaryFileResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $file = $eventManager->getTaskFile($id);
        if (!$file) {
            throw new NotFoundHttpException(SchoolTaskAccessMessages::FILE_NOT_FOUND);
        }

        if (!$eventManager->canAccessTaskFile($user, $file)) {
            throw new AccessDeniedHttpException(SchoolTaskAccessMessages::READ_FILE);
        }

        $path = $eventManager->resolveTaskFileAbsolutePath($file);
        $disposition = 'attachment' === $request->query->get('disposition')
            ? ResponseHeaderBag::DISPOSITION_ATTACHMENT
            : ResponseHeaderBag::DISPOSITION_INLINE;

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition($disposition, $file->getOriginalName());

        return $response;
    }
}
