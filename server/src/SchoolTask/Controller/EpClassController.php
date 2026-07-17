<?php

namespace SchoolTask\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use SchoolTask\Security\SchoolTaskAccessMessages;
use SchoolTask\Service\SchoolTaskManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/schooltask/classes')]
#[Access('schooltask.class')]
class EpClassController extends AbstractController
{
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list(
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        $items = [];
        foreach ($schoolTaskManager->listClasses() as $class) {
            $tutor = $class->getUser();
            $items[] = [
                'id' => $class->getId(),
                'name' => $class->getName(),
                'tutor' => $tutor ? sprintf('%s (%s)', $tutor->getAlias(), $tutor->getLogin()) : '',
            ];
        }

        return $this->json($items);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[Access('can_read')]
    public function show(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $schoolTaskManager->getClassGroup($id);
        if (!$class || !$schoolTaskManager->isClassGroup($class)) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        if (!$userScopeResolver->canReadSchooltaskClass($user) && !$schoolTaskManager->isClassTutor($user, $class)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        return $this->json($schoolTaskManager->serializeClass($class));
    }

    #[Route('', methods: ['POST'])]
    #[Access('can_create')]
    public function create(
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canCreateSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::CREATE_CLASS);
        }

        try {
            $class = $schoolTaskManager->class(null, $request->toArray());
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeClass($class), Response::HTTP_CREATED);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[Access('can_update')]
    public function update(
        int $id,
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $class = $schoolTaskManager->getClassGroup($id);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }

        if (!$userScopeResolver->canUpdateSchooltaskClass($user) && !$schoolTaskManager->isClassTutor($user, $class)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_CLASS);
        }

        try {
            $class = $schoolTaskManager->class($class, $request->toArray());
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeClass($class));
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[Access('can_delete')]
    public function delete(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canDeleteSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::DELETE_CLASS);
        }

        $class = $schoolTaskManager->getClassGroup($id);
        if (!$class) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }

        $schoolTaskManager->removeClass($class);

        return $this->json(['id' => $id]);
    }

    #[Route('/parallels/options', methods: ['GET'])]
    #[Access('can_read')]
    public function parallelsOptions(SchoolTaskManager $schoolTaskManager, UserScopeResolver $userScopeResolver, #[CurrentUser] User $user): JsonResponse
    {
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        $items = [];
        foreach ($schoolTaskManager->getParallelGroups() as $group) {
            $items[] = ['value' => $group->getId(), 'text' => $group->getName()];
        }

        return $this->json($items);
    }

    #[Route('/subjects/options', methods: ['GET'])]
    #[Access('can_read')]
    public function subjectsOptions(SchoolTaskManager $schoolTaskManager, UserScopeResolver $userScopeResolver, #[CurrentUser] User $user): JsonResponse
    {
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        return $this->json($schoolTaskManager->getSubjectsOptions());
    }

    #[Route('/tutors/options', methods: ['GET'])]
    #[Access('can_read')]
    public function tutorsOptions(SchoolTaskManager $schoolTaskManager, UserScopeResolver $userScopeResolver, #[CurrentUser] User $user): JsonResponse
    {
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        return $this->json($schoolTaskManager->getTutors());
    }

    #[Route('/pupils/options', methods: ['GET'])]
    #[Access('can_read')]
    public function pupilsOptions(SchoolTaskManager $schoolTaskManager, UserScopeResolver $userScopeResolver, #[CurrentUser] User $user): JsonResponse
    {
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        return $this->json($schoolTaskManager->getPupils());
    }
}
