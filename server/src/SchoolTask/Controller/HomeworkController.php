<?php

namespace SchoolTask\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use SchoolTask\Entity\EpGroup;
use SchoolTask\Security\SchoolTaskAccessMessages;
use SchoolTask\Service\EventManager;
use SchoolTask\Service\SchoolTaskManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/schooltask/homework')]
#[Access('schooltask.event')]
class HomeworkController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    #[Access('can_read', checkScopes: false)]
    public function list(
        Request $request,
        EventManager $eventManager,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $fromRaw = (string) $request->query->get('from', '');
        $toRaw = (string) $request->query->get('to', '');
        if ('' === trim($fromRaw) || '' === trim($toRaw)) {
            $from = new \DateTime('monday this week');
            $to = (clone $from)->modify('+28 days');
        } else {
            try {
                $from = new \DateTime(str_replace('T', ' ', $fromRaw));
                $to = new \DateTime(str_replace('T', ' ', $toRaw));
            } catch (\Exception) {
                return ApiResponse::badRequest('Некорректный from/to');
            }
        }

        $classId = (int) $request->query->get('class_id', 0);
        if ($classId > 0) {
            $class = $schoolTaskManager->getClassGroup($classId);
            if (!$class instanceof EpGroup || !$schoolTaskManager->isClassGroup($class)) {
                return ApiResponse::notFound(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
            }
            if (!$this->canViewHomework($user, $class, $userScopeResolver, $schoolTaskManager)) {
                return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_EVENT);
            }
            $items = $eventManager->listHomework($from, $to, $classId);
        } else {
            if ($userScopeResolver->isSchooltaskEventRoot($user)) {
                $items = $eventManager->listHomework($from, $to, null);
            } else {
                $items = [];
                foreach ($schoolTaskManager->listClasses(false) as $class) {
                    if (!$this->canViewHomework($user, $class, $userScopeResolver, $schoolTaskManager)) {
                        continue;
                    }
                    foreach ($eventManager->listHomework($from, $to, (int) $class->getId()) as $row) {
                        $items[] = $row;
                    }
                }
                usort($items, static fn (array $a, array $b): int => strcmp((string) ($a['start'] ?? ''), (string) ($b['start'] ?? '')));
            }
        }

        return $this->json(['items' => $items]);
    }

    private function canViewHomework(
        User $user,
        EpGroup $class,
        UserScopeResolver $userScopeResolver,
        SchoolTaskManager $schoolTaskManager,
    ): bool {
        if ($userScopeResolver->isSchooltaskEventRoot($user)) {
            return true;
        }

        return $schoolTaskManager->isClassMember($user, $class)
            || $schoolTaskManager->isClassTutor($user, $class)
            || $schoolTaskManager->isClassLessonTeacher($user, $class)
            || $schoolTaskManager->isClassParent($user, $class);
    }
}
