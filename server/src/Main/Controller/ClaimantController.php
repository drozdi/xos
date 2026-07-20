<?php


namespace Main\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

use App\Http\ApiResponse;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use Main\Repository\ClaimantRepository;
use Main\Security\MainClaimantAccessMessages;
use Main\Service\ClaimantManager;
use Main\Service\MainManager;

#[Route('/api/main/claimant')]
class ClaimantController extends AbstractController {
    #[Route('/access-rules', name: 'main_claimant_access_rules', methods: ['GET'])]
    public function accessRules(
        ClaimantManager $claimantManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::READ);
        }

        $config = $claimantManager->getModuleConfig('main');
        if (null === $config) {
            return ApiResponse::notFound('Правила Main не найдены');
        }

        return $this->json([
            'claimant' => $config['claimant'] ?? [],
            'map-access' => $config['map-access'] ?? [],
        ]);
    }

    #[Route('/app-access-modules', name: 'main_claimant_app_access_modules', methods: ['GET'])]
    public function appAccessModules(
        ClaimantManager $claimantManager,
        #[CurrentUser] User $user,
    ): JsonResponse {
        return $this->json($claimantManager->getAppAccessModules());
    }

    #[Route('/list', name: 'main_claimant_list')]
    public function list (
        Request $request,
        ClaimantRepository $ClaimantRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::READ);
        }

        $req = array_merge([
            't' => "list",
            'size' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "code",
                'order' => "ASC"
            ]],
            'filters' => []
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $ClaimantRepository->cnt($req['filters']);
        $query = $ClaimantRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $claimant) {
                    $items[] = [
                        'id' => $claimant->getId(),
                        'name' => $claimant->getName(),
                        'code' => $claimant->getCode(),
                    ];
                }
                break;
            case 'select':
                foreach ($query->execute() as $claimant) {
                    $items[] = array(
                        'value' => $claimant->getId(),
                        'label' => (string)$claimant,
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
    #[Route('/', name: 'main_claimant_create', methods: ['POST'])]
    public function create (
        Request $request,
        MainManager $mainManager,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canCreateMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::CREATE);
        }

        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $claimant = $mainManager->claimant($req['id'], $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($claimant->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'main_claimant_update', methods: ['PUT'])]
    public function update (
        int $id,
        Request $request,
        MainManager $mainManager,
        ClaimantRepository $ClaimantRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canUpdateMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::UPDATE);
        }

        if (null === $ClaimantRepository->find($id)) {
            return ApiResponse::notFound(MainClaimantAccessMessages::NOT_FOUND);
        }

        $req = $request->toArray();
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $claimant = $mainManager->claimant($id, $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($claimant->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'main_claimant_detail', methods: ['GET', 'HEAD'])]
    public function detail (
        int $id,
        ClaimantRepository $ClaimantRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canReadMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::READ);
        }

        $claimant = $ClaimantRepository->find($id);
        if (null === $claimant) {
            return ApiResponse::notFound(MainClaimantAccessMessages::NOT_FOUND);
        }

        return $this->json([
            'id' => $claimant->getId(),
            'name' => $claimant->getName(),
            'code' => $claimant->getCode(),
        ]);
    }
    #[Route('/{id}', name: 'main_claimant_remove', methods: ['DELETE'])]
    public function remove(
        int $id,
        ClaimantRepository $ClaimantRepository,
        UserScopeResolver $userScopeResolver,
        #[CurrentUser] User $user,
    ): JsonResponse {
        if (!$userScopeResolver->canDeleteMainClaimant($user)) {
            return ApiResponse::forbidden(MainClaimantAccessMessages::DELETE);
        }

        $claimant = $ClaimantRepository->find($id);
        if (null === $claimant) {
            return ApiResponse::notFound(MainClaimantAccessMessages::NOT_FOUND);
        }

        $arClaimant = [
            'id' => $claimant->getId(),
            'code' => $claimant->getCode(),
            'name' => $claimant->getName(),
        ];
        $ClaimantRepository->remove($claimant, true);
        return $this->json($arClaimant);
    }
}
