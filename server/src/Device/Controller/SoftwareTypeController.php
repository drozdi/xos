<?php

namespace Device\Controller;

use App\Attribute\Access;

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

use Device\Entity\Software;
use Device\Entity\Software\Type;

use Device\Repository\SoftwareRepository;
use Device\Repository\Software\TypeRepository;

use Device\Service\SoftwareManager;

#[Route('/device/software/type')]
#[Access('device.software.type')]
class SoftwareTypeController extends AbstractController {
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, TypeRepository $TypeRepository): JsonResponse {
        $req = array_merge([
            'limit' => -1,
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
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        $query->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        foreach ($query->execute() as $s) {
            $items[] = $s;
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/select', methods: ['POST'])]
    public function select (Request $request, TypeRepository $TypeRepository): JsonResponse {
        $req = array_merge([
            'limit' => -1,
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
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        foreach ($query->execute() as $type) {
            $items[] = [
                'id' => $type->getId(),
                'name' => $type->getName()
            ];
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, SoftwareManager $sm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        try {
            $type = $sm->type($req['id'], $req);
        } catch (ValidationFailedException $e) {
            return $this->json($sm->parseViolation($e->getViolations()),Response::HTTP_BAD_REQUEST);
        }
        return $this->json($type->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, SoftwareManager $sm): JsonResponse {
        $req = $request->toArray();
        try {
            $type = $sm->type($id, $req);
        } catch (ValidationFailedException $e) {
            return $this->json($sm->parseViolation($e->getViolations()),Response::HTTP_BAD_REQUEST);
        }
        return $this->json($type->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET', 'HEAD'])]
    #[Access('can_read')]
    public function detail (int $id, SoftwareManager $sm): JsonResponse {
        $type = $sm->type($id);
        return $this->json([
            'id' => $type->getId(),
            'code' => $type->getCode(),
            'name' => $type->getName(),
            'sort' => $type->getSort(),
        ]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, TypeRepository $TypeRepository): JsonResponse {
        $type = $TypeRepository->find($id);
        $arType = [
            'id' => $type->getId(),
            'name' => $type->getName(),
            'code' => $type->getCode(),
            'sort' => $type->getSort(),
        ];
        $TypeRepository->remove($type, true);
        return $this->json($arType);
    }
}