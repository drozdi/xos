<?php


namespace Main\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;

use Main\Entity\OU;
use Main\Entity\User;
use Main\Entity\Group;
use Main\Entity\Claimant;

use Main\Repository\OURepository;
use Main\Repository\UserRepository;
use Main\Repository\GroupRepository;
use Main\Repository\ClaimantRepository;

use Main\Service\MainManager;

#[Route('/api/main/user', name: 'api_main_user_')]
class UserController extends AbstractController {
    #[Route('/list', name: 'list')]
    public function list (Request $request, UserRepository $UserRepository): JsonResponse {
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
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $UserRepository->cnt($req['filters']);
        $query = $UserRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $user) {
                    $items[] = array(
                        'id' => $user->getId(),
                        'login' => $user->getLogin(),
                        'alias' => $user->getAlias(),
                        'ou' => (string)$user->getOu(),
                        'tutor' => (string)$user->getParent(),
                    );
                }
                break;
            case 'select':
                foreach ($query->execute() as $user) {
                    $items[] = array(
                        'value' => $user->getId(),
                        'label' => (string)$user
                    );
                }
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
    public function filter (EntityManagerInterface $entityManager, OURepository $OURepository): JsonResponse {
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
    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'])]
    public function detail (int $id, MainManager $mainManager): JsonResponse {
        $user = $mainManager->user($id);
        $accesses = [];
        foreach ($user->getAccesses() as $access) {
            $accesses[$access->getId()] = [
                'id' => $access->getId(),
                'user_id' => $access->getUser()->getId(),
                'claimant_id' => $access->getClaimant()->getId(),
                'name' => $access->getName(true),
                'level' => $access->getLevel(),
            ];
        }
        $groups = [];
        foreach ($user->getGroups() as $ug) {
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
            'id' => $user->getId(),
            'parent_id' => $user->getParent()? $user->getParent()->getId(): null,
            'x_timestamp' => $user->getXTimestamp("Y-m-d H:m:s"),
            'date_register ' => $user->getDateRegister("Y-m-d H:m:s"),
            'last_login ' => $user->getLastLogin("Y-m-d H:m:s"),
            'last_ip' => $user->getLastIp(),
            'active' => $user->isActive(),
            'activeFrom' => $user->getActiveFrom("Y-m-d H:m:s"),
            'activeTo' => $user->getActiveTo("Y-m-d H:m:s"),
            'loocked ' => $user->isLoocked(),
            'stored_hash' => $user->getStoredHash(),
            'checkword' => $user->getCheckword(),
            'login' => $user->getLogin(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'first_name' => $user->getFirstName(),
            'second_name' => $user->getSecondName(),
            'patronymic' => $user->getPatronymic(),
            'gender' => $user->getGender(),
            'login_attempts' => $user->getLoginAttempts(),
            'country' => $user->getCountry(),
            'ou_id' => $user->getOu()? $user->getOu()->getId(): null,
            'phone' => $user->getPhone(),
            'description' => $user->getDescription(),
            'accesses' => $accesses,
            'groups' => $groups,
            'roles' => $user->getRoles()
        ]);
    }
    #[Route('/', name: 'create', methods: ['POST'])]
    public function create (Request $request, MainManager $mainManager): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $user = $mainManager->user($req['id'], $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($user->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update (int $id, Request $request, MainManager $mainManager): JsonResponse {
        $req = $request->toArray();
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $user = $mainManager->user($id, $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($user->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'remove', methods: ['DELETE'])]
    public function remove (int $id, UserRepository $UserRepository): JsonResponse {
        $user = $UserRepository->find($id);
        $arUser = [
            'id' => $user->getId(),
            'login' => $user->getLogin(),
            'alias' => $user->getAlias(),
        ];
        $UserRepository->remove($user, true);
        return $this->json($arUser);
    }
}
