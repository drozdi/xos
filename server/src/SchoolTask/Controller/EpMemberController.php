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

#[Route('/api/schooltask/members')]
class EpMemberController extends AbstractController
{
    #[Route('/sync', methods: ['POST'])]
    public function sync(
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $payload = $request->toArray();
        $groupId = (int) ($payload['group_id'] ?? 0);
        $users = (array) ($payload['users'] ?? []);
        $group = $schoolTaskManager->getClassGroup($groupId);
        if (!$group) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::GROUP_NOT_FOUND);
        }

        $kind = $schoolTaskManager->getGroupKind($group);
        try {
            switch ($kind) {
                case 'class':
                    if (!$userScopeResolver->canUpdateSchooltaskZam($user)) {
                        return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_ZAM);
                    }
                    $schoolTaskManager->syncClassMembers($group, $users);
                    break;
                case 'parallel_subject':
                    if (!$userScopeResolver->canUpdateSchooltaskZam($user)) {
                        return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_ZAM);
                    }
                    $schoolTaskManager->syncParallelSubjectGroupMembers($group, $users);
                    break;
                case 'class_subject':
                    $isTutor = $schoolTaskManager->isClassTutor($user, $group->getParent());
                    if (!$userScopeResolver->canUpdateSchooltaskZam($user) && !$isTutor) {
                        return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_ZAM);
                    }
                    $schoolTaskManager->syncSubjectGroupMembers($group, $users);
                    break;
                default:
                    return ApiResponse::notFound(SchoolTaskAccessMessages::GROUP_NOT_FOUND);
            }
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json(['id' => $group->getId()]);
    }
}
