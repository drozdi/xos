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

use Device\Service\DeviceManager;

use Device\Entity\Type;
use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;

#[Route('/device/types')]
#[Access('device.type')]
class TypeController extends AbstractController {
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
            'filters' => [
                'parent' => null,
                'property' => null
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
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $t) {
            $items[] = array(
                'value' => $t->getId(),
                'label' => $t->getName(),
                'sublabel' => $t->getCode(),
            );
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/list', name: 'device_types_list', methods: ['POST'])]
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
            'filters' => [
                'parent' => null,
                'property' => null
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
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $query = $query->getQuery();
        $items = [];

        foreach ($query->execute() as $t) {
            $items[] = array(
                'id' => $t->getId(),
                'name' => $t->getName(),
                'code' => $t->getCode(),
                'sort' => $t->getSort(),
                'group_id' => $t->getId(),
                'group_name' => $t->getName(),
                'group_code' => $t->getCode(),
                'group_sort' => $t->getSort(),
            );
            foreach ($t->getChildren() as $sub) {
                $items[] = array(
                    'id' => $sub->getId(),
                    'name' => $sub->getName(),
                    'code' => $sub->getCode(),
                    'sort' => $sub->getSort(),
                    'group_id' => $t->getId(),
                    'group_name' => $t->getName(),
                    'group_code' => $t->getCode(),
                    'group_sort' => $t->getSort(),
                );
            }
        }

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/components', methods: ['GET', 'POST'])]
    #[Access('can_read')]
    public function components (PropertyRepository $PropertyRepository): JsonResponse {
        $items = [];
        foreach ($PropertyRepository->getComponents() as $component) {
            $child = [];
            foreach ($component->getChildren() as $sub) {
                $child[] = [
                    'value' => $sub->getId(),
                    'label' => $sub->getName(),
                    'sublabel' => $sub->getCode(),
                ];
            }
            $items[] = [
                'value' => $component->getId(),
                'label' => $component->getName(),
                'sublabel' => $component->getCode(),
                'children' => $child
            ];
        }
        return $this->json($items);
    }

    #[Route('/properties', methods: ['GET', 'POST'])]
    #[Access('can_read')]
    public function properties (PropertyRepository $PropertyRepository): JsonResponse {
        $items = [];
        foreach ($PropertyRepository->getProperties() as $property) {
            $items[] = [
                'value' => $property->getId(),
                'label' => $property->getName(),
                'sublabel' => $property->getCode()
            ];
        }
        return $this->json($items);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $type = $dm->type($req['id'], $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }

        return $this->json($type->getId(),Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm): JsonResponse {
        $type = $dm->type($id);

        $arComponents = [];
        $arProperties = [];
        foreach ($type->getProperties() as $property) {
            if (null != $property->getType() || null != $property->getParent() && null != $property->getParent()->getType()) {
                $arComponents[] = $property->getId();
                continue;
            }
            $enums = [];
            foreach ($property->getEnums() as $enum) {
                $enums[$enum->getId()] = [
                    'id' => $enum->getId(),
                    'code' => $enum->getCode(),
                    'name' => $enum->getName(),
                    'sort' => $enum->getSort(),
                    'default' => $enum->isDefault()
                ];
            }
            $arProperties[$property->getId()] = [
                'id' => $property->getId(),
                'active' => $property->isActive(),
                'required' => $property->isRequired(),
                'multiple' => $property->isMultiple(),
                'code' => $property->getCode(),
                'name' => $property->getName(),
                'sort' => $property->getSort(),
                'fieldType' => $property->getFieldType(),
                'listType' => $property->getListType(),
                'postfix' => $property->getPostfix(),
                'defaultValue' => $property->getDefaultValue(),
                'enums' => $enums
            ];
        }

        return $this->json([
            'id' => $type->getId(),
            'name' => $type->getName(),
            'sort' => $type->getSort(),
            'code' => $type->getCode(),
            'parent_id' => $type->getParent()? $type->getParent()->getId(): null,
            'components' => $arComponents,
            'properties' => $arProperties
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $type = $dm->type($id, $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }
        return $this->json($type->getId(),Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, TypeRepository $TypeRepository): JsonResponse {
        $type = $TypeRepository->find($id);
        $arType = [
            'id' => $type->getId(),
            'name' => $type->getName(),
            'code' => $type->getCode(),
        ];
        $TypeRepository->remove($type, true);
        return $this->json($arType);
    }

}