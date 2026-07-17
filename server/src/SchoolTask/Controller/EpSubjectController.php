<?php

namespace SchoolTask\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Entity\User\Group as UserGroup;
use SchoolTask\Entity\EpSubject;
use SchoolTask\Repository\EpSubjectRepository;
use SchoolTask\Security\SchoolTaskAccessMessages;
use SchoolTask\Service\SchoolTaskManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/schooltask/subjects')]
#[Access('schooltask.subject')]
class EpSubjectController extends AbstractController
{
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list(
        Request $request,
        EpSubjectRepository $repository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_SUBJECT);
        }

        $req = array_merge([
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [
                ['key' => 'sort', 'order' => 'ASC'],
                ['key' => 'name', 'order' => 'ASC'],
            ],
            'filters' => [],
        ], $request->toArray());

        $items = [];
        foreach ($repository->findFilter($req['filters'], $req['sortBy'], (int) $req['limit'], (int) $req['offset']) as $subject) {
            $items[] = [
                'id' => $subject->getId(),
                'name' => $subject->getName(),
                'sort' => $subject->getSort(),
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
        if (!$userScopeResolver->canReadSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_SUBJECT);
        }

        $subject = $schoolTaskManager->subject($id);
        if (!(int) $subject->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::SUBJECT_NOT_FOUND);
        }

        return $this->json($this->serializeSubject($subject));
    }

    #[Route('', methods: ['POST'])]
    #[Access('can_create')]
    public function create(
        Request $request,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canCreateSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::CREATE_SUBJECT);
        }

        try {
            $subject = $schoolTaskManager->subject(null, $request->toArray());
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($this->serializeSubject($subject), Response::HTTP_CREATED);
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
        if (!$userScopeResolver->canUpdateSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::UPDATE_SUBJECT);
        }

        $subject = $schoolTaskManager->subject($id);
        if (!(int) $subject->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::SUBJECT_NOT_FOUND);
        }

        try {
            $subject = $schoolTaskManager->subject($subject, $request->toArray());
        } catch (ValidationFailedException $e) {
            return $this->json(['message' => (string) $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json($this->serializeSubject($subject));
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[Access('can_delete')]
    public function delete(
        int $id,
        SchoolTaskManager $schoolTaskManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canDeleteSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::DELETE_SUBJECT);
        }

        $subject = $schoolTaskManager->subject($id);
        if (!(int) $subject->getId()) {
            return ApiResponse::notFound(SchoolTaskAccessMessages::SUBJECT_NOT_FOUND);
        }

        $schoolTaskManager->removeSubject($subject);

        return $this->json(['id' => $id]);
    }

    #[Route('/teachers/options', methods: ['GET'])]
    #[Access('can_read')]
    public function teachersOptions(
        EntityManagerInterface $entityManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadSchooltaskSubject($user)) {
            return ApiResponse::forbidden(SchoolTaskAccessMessages::READ_SUBJECT);
        }

        $dql = sprintf('SELECT ug FROM %s ug JOIN ug.group g WHERE g.code = :code', UserGroup::class);
        $items = [];
        foreach ($entityManager->createQuery($dql)->setParameter('code', 'teachers')->execute() as $ug) {
            $items[] = [
                'value' => $ug->getUserId(),
                'text' => sprintf('%s (%s)', $ug->getUserAlias(), $ug->getUserLogin()),
            ];
        }

        return $this->json($items);
    }

    private function serializeSubject(EpSubject $subject): array
    {
        $users = [];
        foreach ($subject->getUsers() as $user) {
            $users[$user->getId()] = [
                'user_id' => $user->getId(),
                'name' => sprintf('%s (%s)', $user->getLogin(), $user->getAlias()),
            ];
        }

        $result = [
            'id' => $subject->getId(),
            'name' => $subject->getName(),
            'sort' => $subject->getSort(),
        ];
        if ([] !== $users) {
            $result['users'] = $users;
        }

        return $result;
    }
}
