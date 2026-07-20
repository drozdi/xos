<?php

namespace Device\Controller;

use App\Attribute\Access;
use Device\Entity\Type;
use Device\Repository\PropertyRepository;
use Device\Repository\TypeRepository;
use Device\Service\DeviceManager;
use Device\Controller\PropertyArrayBuilder;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/device/components')]
#[Access('device.component')]
class ComponentController extends AbstractController {
    use PropertyCatalogTrait;
    private function defaultListRequest (): array {
        return [
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [[
                'key' => 'sort',
                'order' => 'ASC',
            ], [
                'key' => 'name',
                'order' => 'ASC',
            ]],
            'filters' => [
                'property!' => null,
            ],
        ];
    }

    private function mergeListRequest (Request $request): array {
        $defaults = $this->defaultListRequest();
        $req = array_merge($defaults, $request->toArray());
        $req['filters'] = array_merge($defaults['filters'], $req['filters'] ?? []);
        if (empty($req['sortBy'])) {
            $req['sortBy'] = $defaults['sortBy'];
        }
        $req['limit'] = (int)$req['limit'];
        $req['offset'] = (int)$req['offset'];
        return $req;
    }

    private function contentRange (array $req, int $totalItems): array {
        $start = $req['limit'] * ($req['offset'] - 1);
        $end = ($req['limit'] > 0 ? $req['limit'] * $req['offset'] : $totalItems) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;
        return [
            'Content-Range' => sprintf('items %d-%d/%d', $start, $end, $totalItems),
        ];
    }

    private function buildPropertiesResponse (Type $type): array {
        $properties = [];
        foreach ($type->getProperties() as $property) {
            $properties[$property->getId()] = PropertyArrayBuilder::fromProperty($property);
        }
        return $properties;
    }

    private function assertComponentType (Type $type): ?JsonResponse {
        if (!(int)$type->getId()) {
            return $this->json(['id' => 'Не удалось сохранить тип комплектующих'], Response::HTTP_BAD_REQUEST);
        }
        if (null === $type->getProperty()) {
            return $this->json(['property_id' => 'Обязательное поле'], Response::HTTP_BAD_REQUEST);
        }
        return null;
    }

    #[Route('/select', methods: ['POST'])]
    #[Access('can_read')]
    public function select (Request $request, TypeRepository $TypeRepository): JsonResponse {
        $req = array_merge([
            't' => 'list',
        ], $this->mergeListRequest($request));
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $items = [];

        foreach ($query->getQuery()->execute() as $type) {
            $items[] = [
                'value' => $type->getId(),
                'title' => $type->getName(),
                'subtitle' => $type->getCode(),
            ];
        }

        return $this->json($items, Response::HTTP_OK, $this->contentRange($req, $totalItems));
    }

    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list (Request $request, TypeRepository $TypeRepository): JsonResponse {
        $req = $this->mergeListRequest($request);
        $totalItems = $TypeRepository->cnt($req['filters']);
        $query = $TypeRepository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset']);
        $items = [];

        foreach ($query->getQuery()->execute() as $type) {
            $items[] = [
                'id' => $type->getId(),
                'name' => $type->getName(),
                'code' => $type->getCode(),
                'sort' => $type->getSort(),
            ];
        }

        return $this->json($items, Response::HTTP_OK, $this->contentRange($req, $totalItems));
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

    #[Route('/{id}', methods: ['GET'])]
    #[Access('can_read')]
    public function detail (int $id, DeviceManager $dm, TypeRepository $TypeRepository): JsonResponse {
        $type = $TypeRepository->find($id);
        if (!($type instanceof Type) || null === $type->getProperty()) {
            throw $this->createNotFoundException('Component type not found');
        }

        return $this->json([
            'id' => $type->getId(),
            'active' => $type->isActive(),
            'name' => $type->getName(),
            'code' => $type->getCode(),
            'sort' => $type->getSort(),
            'property_id' => $type->getProperty()?->getId(),
            'properties' => $this->buildPropertiesResponse($type),
        ]);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function save (Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $req['id'] = (int)$req['id'];
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $type = $dm->type($req['id'], $req);
            if ($error = $this->assertComponentType($type)) {
                $dm->getEntityManager()->getConnection()->rollBack();
                return $error;
            }
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }
        return $this->json($type->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[Access('can_update')]
    public function update (int $id, Request $request, DeviceManager $dm): JsonResponse {
        $req = $request->toArray();
        $dm->getEntityManager()->getConnection()->beginTransaction();
        try {
            $type = $dm->type($id, $req);
            if ($error = $this->assertComponentType($type)) {
                $dm->getEntityManager()->getConnection()->rollBack();
                return $error;
            }
            $dm->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            return $this->json($dm->parseViolation($e->getViolations()), Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            $dm->getEntityManager()->getConnection()->rollBack();
            throw $e;
        }
        return $this->json($type->getId(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function remove (int $id, TypeRepository $TypeRepository): JsonResponse {
        $type = $TypeRepository->find($id);
        if (!($type instanceof Type) || null === $type->getProperty()) {
            throw $this->createNotFoundException('Component type not found');
        }
        $arType = [
            'id' => $type->getId(),
            'name' => $type->getName(),
            'code' => $type->getCode(),
        ];
        $TypeRepository->remove($type, true);
        return $this->json($arType);
    }
}
