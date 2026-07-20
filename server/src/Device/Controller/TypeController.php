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
use Device\Controller\PropertyArrayBuilder;

#[Route('/api/device/types')]
#[Access('device.type')]
class TypeController extends AbstractController {
    use PropertyCatalogTrait;
    #[Route('/select', methods: ['POST'])]
    #[Access('can_read')]
    public function select (Request $request, TypeRepository $TypeRepository): JsonResponse {
        $defaults = [
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
                'property' => null,
            ],
        ];
        $req = array_merge($defaults, $request->toArray());
        $req['filters'] = array_merge($defaults['filters'], $req['filters'] ?? []);
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
        $defaults = [
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
                'property' => null,
            ],
        ];
        $req = array_merge($defaults, $request->toArray());
        $req['filters'] = array_merge($defaults['filters'], $req['filters'] ?? []);
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
            $children = $t->getChildren()->filter(static function (Type $sub): bool {
                return null === $sub->getProperty();
            });
            if ($children->count() === 0) {
                $items[] = array(
                    'id' => $t->getId(),
                    'name' => $t->getName(),
                    'code' => $t->getCode(),
                    'sort' => $t->getSort(),
                    'group_id' => $t->getId(),
                    'group_name' => null,
                    'group_code' => null,
                    'group_sort' => null,
                );
                continue;
            }

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
            foreach ($children as $sub) {
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
    public function components (TypeRepository $TypeRepository): JsonResponse {
        $items = [];
        foreach ($TypeRepository->getComponents() as $type) {
            $items[] = [
                'value' => $type->getId(),
                'label' => $type->getName(),
                'sublabel' => $type->getCode(),
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

    #[Route('/property-catalog', methods: ['GET'])]
    #[Access('can_read')]
    public function propertyCatalog (PropertyRepository $PropertyRepository): JsonResponse {
        return $this->propertyCatalogResponse($PropertyRepository);
    }

    #[Route('/property-template/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function propertyTemplate (int $id, DeviceManager $dm): JsonResponse {
        return $this->propertyTemplateResponse($id, $dm);
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
    public function detail (int $id, DeviceManager $dm, TypeRepository $TypeRepository): JsonResponse {
        $type = $dm->type($id);

        $arComponents = [];
        $arProperties = [];
        foreach ($type->getProperties() as $property) {
            $componentTypes = $TypeRepository->findBy(['property' => $property], ['sort' => 'ASC', 'name' => 'ASC']);
            if (count($componentTypes) > 0) {
                $arComponents[] = $componentTypes[0]->getId();
                continue;
            }
            $arProperties[$property->getId()] = PropertyArrayBuilder::fromProperty($property);
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