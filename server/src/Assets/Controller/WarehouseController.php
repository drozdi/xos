<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Attribute\Access;
use Assets\Entity\WarehouseItem;
use Assets\Repository\WarehouseItemRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/assets/warehouse')]
#[Access('assets.warehouse')]
class WarehouseController extends AssetsCrudController
{
    public function __construct(
        private readonly WarehouseItemRepository $repository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->repository;
    }

    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list(Request $request): JsonResponse
    {
        return $this->listAction($request);
    }

    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('can_read')]
    public function detail(int $id): JsonResponse
    {
        return $this->detailAction($id);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create(Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->createAction($request, $validator);
    }

    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('can_update')]
    public function update(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->updateAction($id, $request, $validator);
    }

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('can_delete')]
    public function remove(int $id): JsonResponse
    {
        return $this->removeAction($id);
    }

    /** @param WarehouseItem $entity */
    protected function serializeListItem(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'sku' => $entity->getSku(),
            'qty' => $entity->getQty(),
            'unit' => $entity->getUnit(),
            'location' => $entity->getLocation(),
            'sort' => $entity->getSort(),
        ];
    }

    /** @param WarehouseItem $entity */
    protected function serializeDetail(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'sku' => $entity->getSku(),
            'qty' => $entity->getQty(),
            'unit' => $entity->getUnit(),
            'location' => $entity->getLocation(),
            'notes' => $entity->getNotes(),
            'sort' => $entity->getSort(),
        ];
    }

    protected function createEntity(array $data): object
    {
        $entity = new WarehouseItem();
        $this->applyData($entity, $data);

        return $entity;
    }

    /** @param WarehouseItem $entity */
    protected function updateEntity(object $entity, array $data): void
    {
        $this->applyData($entity, $data);
    }

    /** @param WarehouseItem $entity */
    protected function serializeRemoved(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
        ];
    }

    private function applyData(WarehouseItem $entity, array $data): void
    {
        if (\array_key_exists('name', $data)) {
            $entity->setName(trim((string) $data['name']));
        }
        if (\array_key_exists('sku', $data)) {
            $entity->setSku($this->nullableString($data['sku']));
        }
        if (\array_key_exists('qty', $data)) {
            $entity->setQty($this->decimalString($data['qty'], '0'));
        }
        if (\array_key_exists('unit', $data)) {
            $entity->setUnit($this->nullableString($data['unit']));
        }
        if (\array_key_exists('location', $data)) {
            $entity->setLocation($this->nullableString($data['location']));
        }
        if (\array_key_exists('notes', $data)) {
            $entity->setNotes($this->nullableString($data['notes']));
        }
        if (\array_key_exists('sort', $data)) {
            $entity->setSort((int) $data['sort']);
        }
    }
}
