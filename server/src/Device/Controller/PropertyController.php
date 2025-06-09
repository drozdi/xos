<?php

namespace Device\Controller;

use App\Attribute\Access;
use Device\Service\DeviceManager;
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

use Device\Entity\Type;
use Device\Entity\Property;
use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;
use Device\Repository\PropertyEnumRepository;

#[Route('/device/properties')]
#[Access('device.property')]
class PropertyController extends AbstractController {
    #[Route('/select', methods: ['POST'])]
    public function select (Request $request, PropertyRepository $PropertyRepository): JsonResponse {
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
                'type' => null
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

    #[Route('/list', name: 'device_properties_list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, PropertyRepository $PropertyRepository): JsonResponse {
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
                'type' => null
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
        $groups_items = [];
        $one_items = [];
        foreach ($query->execute() as $t) {
            /*$items[] = array(
                       'id' => $t->getId(),
                       'name' => $t->getName(),
                       'code' => $t->getCode(),
                        'sort' => $t->getSort(),
                    );*/
            if ($t->getChildren()->count() === 0) {
                $one_items[] = array(
                    'id' => $t->getId(),
                    'name' => $t->getName(),
                    'code' => $t->getCode(),
                    'sort' => $t->getSort(),
                );
            }
            foreach ($t->getChildren() as $sub) {
                $groups_items[] = array(
                    'id' => $sub->getId(),
                    'name' => $sub->getName(),
                    'code' => $sub->getCode(),
                    'sort' => $sub->getSort(),
                    'group_id' => $t->getId(),
                    'group_name' => $t->getName(),
                    'group_code' => $t->getCode(),
                    'group_sort' => $t->getSort(),
                );
            }//*/
        }
        $items = array_merge($one_items, $groups_items);

        $start = $req['limit']*($req['offset']-1);
        $end = ($req['limit'] > 0? $req['limit']*$req['offset']: $totalItems)-1;
        $end = $end > $totalItems-1? $totalItems - 1: $end;
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", $start, $end, $totalItems)
        ]);
    }

    #[Route('/props', methods: ['POST'])]
    #[Access('can_read')]
    public function props (PropertyRepository $PropertyRepository): JsonResponse {
        $items = [];
        foreach ($PropertyRepository->findFilter([
            'parent' => null,
            'type!' => null
        ], [[
            'key' => "sort",
            'order' => "ASC"
        ], [
            'key' => "name",
            'order' => "ASC"
        ]]) as $property) {
            $items[] = [
                'label' => $property->getName()." (".$property->getCode().")",
                'sublabel' => $property->getCode(),
                'type' => 'subheader'
            ];
            foreach ($property->getChildren() as $subProperty) {
                $items[] = [
                    'label' => $subProperty->getName(),
                    'sublabel' => $subProperty->getCode(),
                    'name' => $subProperty->getName(),
                    'code' => $subProperty->getCode(),
                    'value' => $subProperty->getId(),
                    'active' => $subProperty->isActive(),
                    'required' => $subProperty->isRequired(),
                    'multiple' => $subProperty->isMultiple(),
                    'disabled' => $subProperty->getPrototype(),
                    'class' => "pl-6"
                ];
            }
        }
        return $this->json($items, Response::HTTP_OK, [
            'Content-Range' => sprintf("items %d-%d/%d", 0, count($items)-1, count($items))
        ]);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create (Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];

        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $property = $dm->property($req['id'], $req);
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }

        return $this->json($property->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm): JsonResponse {
        $property = $dm->property($id);
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
        $varieties = [];
        foreach ($dm->getPropertyRepository()->findBy([
            'prototype' => $property
        ]) as $variant) {
            $type = $variant->getParent()? $variant->getParent()->getType(): null;
            $varieties[$variant->getId()] = [
                'title' => $type? sprintf('%s (%s)', $type->getName(), $type->getCode()): null,
                'subTitle' => sprintf('%s (%s)', $variant->getName(), $variant->getCode()),
                'id' => $variant->getId(),
                'active' => $variant->isActive(),
                'required' => $variant->isRequired(),
                'multiple' => $variant->isMultiple(),
                'code' => $variant->getCode(),
                'name' => $variant->getName(),
                'listType' => $variant->getListType(),
            ];
        }
        return $this->json([
            'id' => $property->getId(),
            'active' => $property->isActive(),
            'required' => $property->isRequired(),
            'multiple' => $property->isMultiple(),
            'name' => $property->getName(),
            'code' => $property->getCode(),
            'sort' => $property->getSort(),
            'postfix' => $property->getPostfix(),
            'fieldType' => $property->getFieldType(),
            'listType' => $property->getListType(),
            'defaultValue' => $property->getDefaultValue(),
            'enums' => $enums,
            'varieties' => $varieties,
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();

        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $property = $dm->property($id, $req);
            $dm->getEntityManager()->flush();
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }

        return $this->json($property->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, PropertyRepository $PropertyRepository): JsonResponse {
        $property = $PropertyRepository->find($id);
        $arProperty = [
            'id' => $property->getId(),
            'name' => $property->getName(),
            'code' => $property->getCode(),
        ];
        $PropertyRepository->remove($property, true);
        return $this->json($arProperty);
    }
}