<?php


namespace Main\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Doctrine\ORM\EntityManagerInterface;

use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\OU;
use Main\Entity\User;
use Main\Repository\OURepository;
use Main\Repository\GroupRepository;
use Main\Security\MainGroupAccessMessages;
use Main\Service\MainManager;

#[Route('/api/main/group', name: 'api_main_group_')]
class GroupController extends AbstractController {
    #[Route('/list', name: 'list')]
    public function list (
        Request $request,
        GroupRepository $GroupRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainGroup($user)) {
            return ApiResponse::forbidden(MainGroupAccessMessages::READ);
        }

        $req = array_merge([
            't' => "list",
            'size' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "sort",
                'order' => "ASC"
            ], [
                'key' => "code",
                'order' => "ASC"
            ]],
            'filters' => [
                'ou' => -1
            ]
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $GroupRepository->cnt($req['filters']);
        $query = $GroupRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $group) {
                    $items[] = array(
                        'id' => $group->getId(),
                        'code' => $group->getCode(),
                        'name' => $group->getName(),
                        'sort' => $group->getSort(),
                        'ou' => (string)$group->getOu(),
                        'tutor' => (string)$group->getUser(),
                    );
                }
                break;
            case 'select':
                foreach ($query->execute() as $group) {
                    $items[] = array(
                        'value' => $group->getId(),
                        'label' => sprintf('%s (%s)', $group->getName(), $group->getCode())
                    );
                }
                break;
            default:
                $query->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
                foreach ($query->execute() as $group) {
                    $items[] = $group;
                }
                break;
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }
    #[Route('/filter', name: 'filter')]
    public function loadFilter (
        EntityManagerInterface $entityManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainGroup($user)) {
            return ApiResponse::forbidden(MainGroupAccessMessages::READ);
        }

        $items = [];
        foreach ($entityManager->createQuery('SELECT ou FROM ' . OU::class . ' ou ORDER BY ou.sort ASC, ou.code ASC')->execute() as $ou) {
            $items[] = [
                'id' => $ou->getId(),
                'code' => $ou->getCode(),
                'name' => $ou->getName(),
                'description' => $ou->getDescription()
            ];
        }
        return $this->json($items);
    }
    #[Route('/', name: 'create', methods: ['POST'])]
    public function create (
        Request $request,
        MainManager $mainManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canCreateMainGroup($user)) {
            return ApiResponse::forbidden(MainGroupAccessMessages::CREATE);
        }

        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $req = $this->filterGroupCreatePayload($req, $userScopeResolver, $user);
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $group = $mainManager->group($req['id'], $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($group->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update (
        int $id,
        Request $request,
        MainManager $mainManager,
        GroupRepository $GroupRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canUpdateMainGroup($user)
            && !$userScopeResolver->canUserMainGroup($user)
            && !$userScopeResolver->canAccessMainGroup($user)
        ) {
            return ApiResponse::forbidden(MainGroupAccessMessages::UPDATE);
        }

        if (null === $GroupRepository->find($id)) {
            return ApiResponse::notFound(MainGroupAccessMessages::NOT_FOUND);
        }

        $req = $this->filterGroupUpdatePayload($request->toArray(), $userScopeResolver, $user);
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $group = $mainManager->group($id, $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($group->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'])]
    public function detail (
        int $id,
        MainManager $mainManager,
        GroupRepository $GroupRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainGroup($user)) {
            return ApiResponse::forbidden(MainGroupAccessMessages::READ);
        }

        $group = $GroupRepository->find($id);
        if (null === $group) {
            return ApiResponse::notFound(MainGroupAccessMessages::NOT_FOUND);
        }

        $group = $mainManager->group($id);
        $accesses = array();
        foreach ($group->getAccesses() as $access) {
            $accesses[$access->getId()] = array(
                'id' => $access->getId(),
                'claimant_id' => $access->getClaimant()->getId(),
                'name' => $access->getName(true),
                'level' => $access->getLevel(),
            );
        }
        $users = array();
        foreach ($group->getUsers() as $ug) {
            $users[$ug->getId()] = array(
                'id' => $ug->getId(),
                'user_id' => $ug->getUser()->getId(),
                'group_id' => $ug->getGroup()->getId(),
                'activeFrom' => $ug->getActiveFrom("Y-m-d H:m:s"),
                'activeTo' => $ug->getActiveTo("Y-m-d H:m:s"),
                'name' => sprintf('%s (%s)', $ug->getUserLogin(), $ug->getUserAlias())
            );
        }
        return $this->json([
            'id' => $group->getId(),
            'x_timestamp' => $group->getXTimestamp("Y-m-d H:m:s"),
            'user_id' => $group->getUser()? $group->getUser()->getId(): null,
            'ou_id' => $group->getOu()? $group->getOu()->getId(): null,
            'parent_id' => $group->getParent()? $group->getParent()->getId(): null,
            'active' => $group->isActive(),
            'activeFrom' => $group->getActiveFrom("Y-m-d H:m:s"),
            'activeTo' => $group->getActiveTo("Y-m-d H:m:s"),
            'sort' => $group->getSort(),
            'name' => $group->getName(),
            'code' => $group->getCode(),
            'anonymous' => $group->isAnonymous(),
            'description' => $group->getDescription(),
            'accesses' => (object) $accesses,
            'users' => (object) $users
        ]);
    }
    #[Route('/{id}', name: 'remove', methods: ['DELETE'])]
    public function remove(
        int $id,
        GroupRepository $GroupRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canDeleteMainGroup($user)) {
            return ApiResponse::forbidden(MainGroupAccessMessages::DELETE);
        }

        $group = $GroupRepository->find($id);
        if (null === $group) {
            return ApiResponse::notFound(MainGroupAccessMessages::NOT_FOUND);
        }

        $arGroup = [
            'id' => $group->getId(),
            'code' => $group->getCode(),
            'name' => $group->getName(),
        ];
        $GroupRepository->remove($group, true);
        return $this->json($arGroup);
    }

    /**
     * @param array<string, mixed> $req
     *
     * @return array<string, mixed>
     */
    private function filterGroupUpdatePayload(array $req, UserScopeResolver $userScopeResolver, User $user): array
    {
        if (!$userScopeResolver->canUpdateMainGroup($user)) {
            foreach ([
                'code',
                'name',
                'sort',
                'description',
                'active',
                'anonymous',
                'activeFrom',
                'activeTo',
                'ou_id',
                'parent_id',
                'user_id',
            ] as $field) {
                unset($req[$field]);
            }
        }

        if (!$userScopeResolver->canUserMainGroup($user)) {
            unset($req['users']);
        }

        if (!$userScopeResolver->canAccessMainGroup($user)) {
            unset($req['accesses']);
        }

        return $req;
    }

    /**
     * @param array<string, mixed> $req
     *
     * @return array<string, mixed>
     */
    private function filterGroupCreatePayload(array $req, UserScopeResolver $userScopeResolver, User $user): array
    {
        if (!$userScopeResolver->canUserMainGroup($user)) {
            unset($req['users']);
        }

        if (!$userScopeResolver->canAccessMainGroup($user)) {
            unset($req['accesses']);
        }

        return $req;
    }
}
