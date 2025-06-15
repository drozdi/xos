<?php


namespace Main\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;

use Main\Entity\OU;
use Main\Entity\User;
use Main\Entity\Group;
use Main\Entity\Claimant;

use Main\Repository\OURepository;
use Main\Repository\UserRepository;
use Main\Repository\GroupRepository;
use Main\Repository\ClaimantRepository;

use Main\Service\MainManager;

#[Route('/api/main/ou', name: 'api_main_ou_')]
class OUController extends AbstractController {
    #[Route('/list', name: 'list')]
    public function дшые (Request $request, OURepository $OURepository): JsonResponse {
        $req = array_merge([
            't' => "list",
            'size' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]],
            'filters' => []
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $OURepository->cnt($req['filters']);
        $query = $OURepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        switch ($req['t']) {
            case 'list':
                foreach ($query->execute() as $ou) {
                    $items[] = [
                        'id' => $ou->getId(),
                        'name' => $ou->getName(),
                        'code' => $ou->getCode(),
                        'description' => $ou->getDescription(),
                        'sort' => $ou->getSort(),
                        'is_tutors' => $ou->isIsTutors()? 1: 0,
                        'user_id' => $ou->getUser()? $ou->getUser()->getId(): 0,
                        'tutor' => (string)$ou->getUser(),
                    ];
                }
                break;
            case 'select':
                foreach ($query->execute() as $ou) {
                    $items[] = array(
                        'value' => $ou->getId(),
                        'label' => (string)$ou,
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
    #[Route('/', name: 'create', methods: ['POST'])]
    public function create (Request $request, MainManager $mainManager): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $ou = $mainManager->ou($req['id'], $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($ou->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update (int $id, Request $request, MainManager $mainManager): JsonResponse {
        $req = $request->toArray();
        $mainManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $ou = $mainManager->ou($id, $req);
            $mainManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $mainManager->getEntityManager()->getConnection()->rollBack();
            return $this->json($mainManager->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($ou->getId(), Response::HTTP_CREATED);
    }
    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'])]
    public function detail (int $id, MainManager $mainManager): JsonResponse {
        $ou = $mainManager->ou($id);
        return $this->json([
            'id' => $ou->getId(),
            'name' => $ou->getName(),
            'code' => $ou->getCode(),
            'description' => $ou->getDescription(),
            'sort' => $ou->getSort(),
            'x_timestamp' => $ou->getXTimestamp(),
            'is_tutors' => $ou->isIsTutors(),
            'user_id' => $ou->getUser()? $ou->getUser()->getId(): null,
        ]);
    }
    #[Route('/{id}', name: 'remove', methods: ['DELETE'])]
    public function remove (int $id, OURepository $OURepository): JsonResponse {
        $ou = $OURepository->find($id);
        $arOu = [
            'id' => $ou->getId(),
            'code' => $ou->getCode(),
            'description' => $ou->getDescription(),
            'sort' => $ou->getSort(),
            'x_timestamp' => $ou->getXTimestamp(),
            'is_tutors' => $ou->isIsTutors(),
            'user_id' => $ou->getUser()? $ou->getUser()->getId(): null,
        ];
        $OURepository->remove($ou, true);
        return $this->json($arOu);
    }
}
