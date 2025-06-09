<?php

namespace Device\Controller;

use App\Attribute\Access;
use Device\Service\DeviceManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;

use Device\Entity\Type;
use Device\Entity\Property;
use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;
use Device\Repository\PropertyEnumRepository;

#[Route('/device/components')]
#[Access('device.property')]
class ComponentController extends AbstractController {
    #[Route('/select', methods: ['POST'])]
    #[Access('can_read')]
    public function select (Request $request, PropertyRepository $PropertyRepository): JsonResponse {
        /*throw $this->createNotFoundException(
            'No product found for id'
        );//*/
        $req = array_merge([
            't' => "list",
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
                'parent' => null,
                'type!' => null
            ]
        ], $request->toArray());
        if (empty($req['sortBy'])) {
            $req['sortBy'] =[[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $PropertyRepository->cnt($req['filters']);
        $query = $PropertyRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $t) {
            $items[] = array(
                'value' => $t->getId(),
                'title' => $t->getName(),
                'subtitle' => $t->getCode(),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, PropertyRepository $PropertyRepository): JsonResponse {
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
                'parent' => null,
                'type!' => null
            ]
        ], $request->toArray());
        if (empty($req['sortBy'])) {
            $req['sortBy'] =[[
                'key' => "sort",
                'order' => "ASC",
            ], [
                'key' => "name",
                'order' => "ASC",
            ]];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        $totalItems = $PropertyRepository->cnt($req['filters']);
        $query = $PropertyRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $t) {
            $items[] = array(
                'id' => $t->getId(),
                'name' => $t->getName(),
                'code' => $t->getCode(),
                'sort' => $t->getSort(),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm): JsonResponse {
        $component = $dm->component($id);
        $children = [];
        foreach ($component->getChildren() as $child) {
            $enums = [];
            foreach ($child->getEnums() as $enum) {
                $enums[$enum->getId()] = [
                    'id' => $enum->getId(),
                    'code' => $enum->getCode(),
                    'name' => $enum->getName(),
                    'sort' => $enum->getSort(),
                    'default' => $enum->isDefault()
                ];
            }
            $children[$child->getId()] = [
                'id' => $child->getId(),
                'active' => $child->isActive(),
                'required' => $child->isRequired(),
                'multiple' => $child->isMultiple(),
                'code' => $child->getCode(),
                'name' => $child->getName(),
                'sort' => $child->getSort(),
                'fieldType' => $child->getFieldType(),
                'listType' => $child->getListType(),
                'postfix' => $child->getPostfix(),
                'defaultValue' => $child->getDefaultValue(),
                'enums' => $enums,
            ];
        }


        return $this->json([
            'id' => $component->getId(),
            'active' => $component->isActive(),
            'name' => $component->getName(),
            'code' => $component->getCode(),
            'sort' => $component->getSort(),
            'children' => $children,
        ]);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function save (Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $component = $dm->component($req['id'], $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            throw $e;
        }
        return $this->json($component->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $component = $dm->component($id, $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            throw $e;
        }
        return $this->json($component->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, PropertyRepository $PropertyRepository): JsonResponse {
        $component = $PropertyRepository->find($id);
        $arComponent = [
            'id' => $component->getId(),
            'name' => $component->getName(),
            'code' => $component->getCode(),
        ];
        $PropertyRepository->remove($component, true);
        return $this->json($arComponent);
    }
}