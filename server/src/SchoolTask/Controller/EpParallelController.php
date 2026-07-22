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

#[Route('/api/schooltask/parallels')]
#[Access('schooltask.class')]
class EpParallelController extends AbstractController
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
        foreach ($schoolTaskManager->listParallels() as $parallel) {
            $items[] = $schoolTaskManager->serializeParallel($parallel);
        }

        return $this->json($items);
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
            $parallel = $schoolTaskManager->createParallel($request->toArray());
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeParallel($parallel), Response::HTTP_CREATED);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[Access('can_read')]
    public function show(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $parallel = $schoolTaskManager->getClassGroup($id);
        if (!$parallel || !$schoolTaskManager->isParallelGroup($parallel)) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if (!$userScopeResolver->canReadSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_CLASS);
        }

        return $this->json($schoolTaskManager->serializeParallel($parallel));
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
        $parallel = $schoolTaskManager->getClassGroup($id);
        if (!$parallel || !$schoolTaskManager->isParallelGroup($parallel)) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if (!$userScopeResolver->canUpdateSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_CLASS);
        }

        try {
            $payload = $request->toArray();
            if (array_key_exists('name', $payload)) {
                $parallel = $schoolTaskManager->group($parallel, [
                    'name' => $payload['name'],
                    'sort' => $payload['sort'] ?? $parallel->getSort(),
                ]);
            }
            if (array_key_exists('sub', $payload)) {
                $schoolTaskManager->syncParallelSubjectGroups($parallel, (array) $payload['sub']);
            }
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeParallel($parallel));
    }

    #[Route('/{id}/promote', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[Access('can_update')]
    public function promote(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $parallel = $schoolTaskManager->getClassGroup($id);
        if (!$parallel || !$schoolTaskManager->isParallelGroup($parallel)) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if (!$userScopeResolver->canUpdateSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_CLASS);
        }
        try {
            $schoolTaskManager->promoteParallel($parallel);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeParallel($parallel));
    }

    #[Route('/{id}/graduate', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[Access('can_update')]
    public function graduate(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $parallel = $schoolTaskManager->getClassGroup($id);
        if (!$parallel || !$schoolTaskManager->isParallelGroup($parallel)) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if (!$userScopeResolver->canUpdateSchooltaskClass($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_CLASS);
        }
        try {
            $schoolTaskManager->graduateParallel($parallel);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($schoolTaskManager->serializeParallel($parallel));
    }
}
