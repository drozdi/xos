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
use Main\Entity\Group;
use Main\Repository\OURepository;
use Main\Repository\UserRepository;
use Main\Security\MainUserAccessMessages;
use Main\Service\ClaimantManager;
use Main\Service\MainManager;

#[Route('/api/main/user', name: 'api_main_user_')]
class UserController extends AbstractController {
    #[Route('/list', name: 'list')]
    public function list (
        Request $request,
        UserRepository $UserRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::READ);
        }

        $req = array_merge([
            't' => "list",
            'size' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "login",
                'order' => "ASC"
            ]],
            'filters' => [
                'ou' => -1,
                'group' => -1
            ]
        ], $request->toArray());
        if (!array_key_exists('limit', $req) && array_key_exists('size', $req)) {
            $req['limit'] = (int)$req['size'];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $UserRepository->cnt($req['filters']);
        $query = $UserRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $userEntity) {
                    $items[] = array(
                        'id' => $userEntity->getId(),
                        'login' => $userEntity->getLogin() ?? '',
                        'alias' => $userEntity->getAlias() ?? '',
                        'ou' => (string)$userEntity->getOu(),
                        'tutor' => (string)$userEntity->getParent(),
                    );
                }
                break;
            case 'select':
                $items = $UserRepository->findSelectItems(
                    $req['filters'],
                    $req['sortBy'],
                    $req['limit'],
                    $req['offset'],
                );
                break;
            default:
                $query->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
                foreach ($query->execute() as $c) {
                    $items[] = $c;
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
    public function filter (
        EntityManagerInterface $entityManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::READ);
        }

        $items = [];
        foreach ($entityManager->createQuery('SELECT ou FROM '.OU::class.' ou ORDER BY ou.sort ASC, ou.code ASC')->execute() as $ou) {
            $item = [
                'value' => $ou->getId(),
                'title' => $ou->getName(),
            ];

            $groups = [];
            foreach ($entityManager->createQuery('SELECT g FROM '.Group::class.' g WHERE g.level = 0 AND g.ou = '.$ou->getId().' ORDER BY g.sort ASC, g.code ASC')->execute() as $group) {
                if (count($group->getChildren()) > 0) {
                    $groups[] = array(
                        'type' => 'subheader',
                        'key' => $group->getId(),
                        'value' => $group->getId(),
                        'title' => $group->getName(),
                    );
                    $groups[] = array(
                        'key' => $group->getId(),
                        'value' => $group->getId(),
                        'title' => "Все",
                    );
                    foreach ($group->getChildren() as $subGroup) {
                        $groups[] = array(
                            'key' => $subGroup->getId(),
                            'value' => $subGroup->getId(),
                            'title' => $subGroup->getName(),
                        );
                    }
                    $groups[] = array(
                        'type' => 'divider',
                    );
                } else {
                    $groups[] = array(
                        'key' => $group->getId(),
                        'value' => $group->getId(),
                        'title' => $group->getName(),
                    );
                }
            }
            if (!empty($groups)) {
                $item['groups'] = $groups;
            }
            $items[] = $item;
        }
        return $this->json($items);
    }

    #[Route('/role-options', name: 'role_options', methods: ['GET'])]
    public function roleOptions(
        ClaimantManager $claimantManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::READ);
        }

        return $this->json($this->buildAssignableRoles($claimantManager));
    }

    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'])]
    public function detail (
        int $id,
        MainManager $mainManager,
        UserRepository $UserRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::READ);
        }

        $existing = $UserRepository->find($id);
        if (null === $existing) {
            return ApiResponse::notFound(MainUserAccessMessages::NOT_FOUND);
        }

        $userEntity = $mainManager->user($id);
        $accesses = array();
        foreach ($userEntity->getAccesses() as $access) {
            $accesses[$access->getId()] = [
                'id' => $access->getId(),
                'user_id' => $access->getUser()->getId(),
                'claimant_id' => $access->getClaimant()->getId(),
                'name' => $access->getName(true),
                'level' => $access->getLevel(),
            ];
        }
        $groups = array();
        foreach ($userEntity->getGroups() as $ug) {
            $groups[$ug->getId()] = [
                'id' => $ug->getId(),
                'user_id' => $ug->getUser()->getId(),
                'group_id' => $ug->getGroup()->getId(),
                'activeFrom' => $ug->getActiveFrom("Y-m-d H:m:s"),
                'activeTo' => $ug->getActiveTo("Y-m-d H:m:s"),
                'name' => sprintf('%s (%s)', $ug->getGroupName(), $ug->getGroupCode())
            ];
        }

        return $this->json([
            'id' => $userEntity->getId(),
            'parent_id' => $userEntity->getParent()? $userEntity->getParent()->getId(): null,
            'x_timestamp' => $userEntity->getXTimestamp("Y-m-d H:m:s"),
            'date_register' => $userEntity->getDateRegister("Y-m-d H:m:s"),
            'last_login' => $userEntity->getLastLogin("Y-m-d H:m:s"),
            'last_ip' => $userEntity->getLastIp(),
            'active' => $userEntity->isActive(),
            'activeFrom' => $userEntity->getActiveFrom("Y-m-d H:m:s"),
            'activeTo' => $userEntity->getActiveTo("Y-m-d H:m:s"),
            'loocked ' => $userEntity->isLoocked(),
            'stored_hash' => $userEntity->getStoredHash(),
            'checkword' => $userEntity->getCheckword(),
            'login' => $userEntity->getLogin(),
            'email' => $userEntity->getEmail(),
            'alias' => $userEntity->getAlias(),
            'first_name' => $userEntity->getFirstName(),
            'second_name' => $userEntity->getSecondName(),
            'patronymic' => $userEntity->getPatronymic(),
            'gender' => $userEntity->getGender(),
            'login_attempts' => $userEntity->getLoginAttempts(),
            'country' => $userEntity->getCountry(),
            'ou_id' => $userEntity->getOu()? $userEntity->getOu()->getId(): null,
            'phone' => $userEntity->getPhone(),
            'description' => $userEntity->getDescription(),
            'accesses' => (object) $accesses,
            'groups' => (object) $groups,
            'roles' => array_values(array_filter(
                $userEntity->getRoles(),
                static fn (string $role): bool => User::ROLE_USER !== $role,
            )),
        ]);
    }
    #[Route('/', name: 'create', methods: ['POST'])]
    public function create (
        Request $request,
        MainManager $mainManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canCreateMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::CREATE);
        }

        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $req = $this->filterUserCreatePayload($req, $userScopeResolver, $user);
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $userEntity = $mainManager->user($req['id'], $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($userEntity->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update (
        int $id,
        Request $request,
        MainManager $mainManager,
        UserRepository $UserRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $existing = $UserRepository->find($id);
        if (null === $existing) {
            return ApiResponse::notFound(MainUserAccessMessages::NOT_FOUND);
        }

        $req = $request->toArray();
        $req = $this->filterUserUpdatePayload($req, $userScopeResolver, $user);
        if ([] === $req) {
            return ApiResponse::forbidden(MainUserAccessMessages::UPDATE);
        }

        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $userEntity = $mainManager->user($id, $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($userEntity->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'remove', methods: ['DELETE'])]
    public function remove (
        int $id,
        UserRepository $UserRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canDeleteMainUser($user)) {
            return ApiResponse::forbidden(MainUserAccessMessages::DELETE);
        }

        $userEntity = $UserRepository->find($id);
        if (null === $userEntity) {
            return ApiResponse::notFound(MainUserAccessMessages::NOT_FOUND);
        }

        $arUser = [
            'id' => $userEntity->getId(),
            'login' => $userEntity->getLogin(),
            'alias' => $userEntity->getAlias(),
        ];
        $UserRepository->remove($userEntity, true);
        return $this->json($arUser);
    }

    /**
     * @return list<string>
     */
    private function buildAssignableRoles(ClaimantManager $claimantManager): array
    {
        $roles = ['ROLE_ROOT'];

        foreach ($claimantManager->getMap() as $appKey => $item) {
            $prefix = strtoupper(str_replace('.', '_', $appKey));
            $roles[] = "ROLE_{$prefix}";
            $roles[] = "ROLE_{$prefix}_ROOT";
            $roles[] = "ROLE_{$prefix}_ADMIN";

            foreach (array_keys($item['claimant'] ?? []) as $code) {
                if ($code === $appKey) {
                    continue;
                }
                $scopePrefix = strtoupper(str_replace('.', '_', $code));
                $roles[] = "ROLE_{$scopePrefix}_ROOT";
            }
        }

        sort($roles);

        return array_values(array_unique($roles));
    }

    /**
     * @param array<string, mixed> $req
     *
     * @return array<string, mixed>
     */
    private function filterUserUpdatePayload(array $req, UserScopeResolver $userScopeResolver, User $user): array
    {
        if (!$userScopeResolver->canUpdateMainUser($user)) {
            foreach ([
                'login',
                'alias',
                'email',
                'first_name',
                'second_name',
                'patronymic',
                'phone',
                'description',
                'active',
                'activeFrom',
                'activeTo',
                'ou_id',
                'parent_id',
                'gender',
                'country',
                'password',
                'confirm_password',
            ] as $field) {
                unset($req[$field]);
            }
        }

        if (!$userScopeResolver->canGroupMainUser($user)) {
            unset($req['groups']);
        }

        if (!$userScopeResolver->canAccessMainUser($user)) {
            unset($req['accesses']);
        }

        if (!$userScopeResolver->canRoleMainUser($user)) {
            unset($req['roles']);
        }

        return $req;
    }

    /**
     * @param array<string, mixed> $req
     *
     * @return array<string, mixed>
     */
    private function filterUserCreatePayload(array $req, UserScopeResolver $userScopeResolver, User $user): array
    {
        if (!$userScopeResolver->canGroupMainUser($user)) {
            unset($req['groups']);
        }

        if (!$userScopeResolver->canAccessMainUser($user)) {
            unset($req['accesses']);
        }

        if (!$userScopeResolver->canRoleMainUser($user)) {
            unset($req['roles']);
        }

        return $req;
    }
}
