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

#[Route('/device/software')]
#[Access('device.software')]
class SoftwareController extends AbstractController {
    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, SoftwareRepository $SoftwareRepository): JsonResponse {
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
            'filters' => [
                'parent' => null
            ]
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $SoftwareRepository->cnt($req['filters']);
        $query = $SoftwareRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $s) {
            $item = [
                'id' => $s->getId(),
                'name' => $s->getName(),
                'type' => $s->getType()->getName(),
                'sort' => $s->getSort()
            ];
            if ($s->getChildren()->count() > 0) {
                $item = array_merge($item, [
                    'group_id' => $s->getId(),
                    'group_name' => $s->getName(),
                    'group_type' => $s->getType()->getName(),
                    'group_sort' => $s->getSort(),
                ]);
            }
            $items[] = $item;
            foreach ($s->getChildren() as $sub) {
                $items[] = [
                    'id' => $sub->getId(),
                    'name' => $sub->getName(),
                    'type' => $sub->getType()->getName(),
                    'sort' => $sub->getSort(),
                    'group_id' => $s->getId(),
                    'group_name' => $s->getName(),
                    'group_type' => $s->getType()->getName(),
                    'group_sort' => $s->getSort(),
                ];
            }
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/select', methods: ['POST'])]
    public function select (Request $request, SoftwareRepository $SoftwareRepository): JsonResponse {
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
            'filters' => [
                'parent' => null
            ]
        ], $request->toArray());
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $SoftwareRepository->cnt($req['filters']);
        $query = $SoftwareRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];
        foreach ($query->execute() as $s) {
            $items[] = [
                'id' => $s->getId(),
                'name' => $s->getName()
            ];
        }
        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/filter', methods: ['GET'])]
    #[Access('can_read')]
    public function filter (EntityManagerInterface $entityManager): JsonResponse {
        $items = [];
        foreach ($entityManager->createQuery('SELECT t FROM ' . Type::class . ' t ORDER BY t.sort ASC, t.code ASC')->execute() as $t) {
            $items[] = [
                'value' => $t->getId(),
                'label' => $t->getName()
            ];
        }
        return $this->json($items);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, SoftwareManager $sm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $sm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $software = $sm->software($req['id'], $req);
            $sm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $sm->getEntityManager()->getConnection()->rollBack();
            return $this->json($sm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }

        return $this->json($software->getId(),Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, SoftwareManager $sm): JsonResponse {
        $req = $request->toArray();
        $sm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $software = $sm->software($id, $req);
            $sm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $sm->getEntityManager()->getConnection()->rollBack();
            return $this->json($sm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        }
        return $this->json($software->getId(),Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, SoftwareManager $sm): JsonResponse {
        $software = $sm->software($id);
        return $this->json([
            'id' => $software->getId(),
            'name' => $software->getName(),
            'sort' => $software->getSort(),
            'parent_id' => $software->getParent()? $software->getParent()->getId(): null,
            'type_id' => $software->getType()? $software->getType()->getId(): null,
        ]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, SoftwareRepository $SoftwareRepository): JsonResponse {
        $software = $SoftwareRepository->find($id);
        $arSoftware = [
            'id' => $software->getId(),
            'name' => $software->getName(),
            'sort' => $software->getSort(),
            'parent_id' => $software->getParent()? $software->getParent()->getId(): null,
            'type_id' => $software->getType()? $software->getType()->getId(): null,
        ];
        $SoftwareRepository->remove($software, true);
        return $this->json($arSoftware);
    }
}