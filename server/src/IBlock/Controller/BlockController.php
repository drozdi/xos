<?php

namespace IBlock\Controller;

use AbstractRepository;
use IBlock\Entity\Block;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\TypeRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/iblock/block', name: 'api_iblock_block_')]
class BlockController extends IBlockCrudController
{
    public function __construct(
        private readonly BlockRepository $blockRepository,
        private readonly TypeRepository $typeRepository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->blockRepository;
    }

    protected function getListAlias(): string
    {
        return 'b';
    }

    #[Route('/list', name: 'list', methods: ['POST'])]
    public function listAction(Request $request): JsonResponse
    {
        return $this->list($request);
    }

    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'], requirements: ['id' => '\d+'])]
    public function detailAction(int $id): JsonResponse
    {
        return $this->detail($id);
    }

    #[Route('/', name: 'create', methods: ['POST'])]
    public function createAction(Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->create($request, $validator);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateAction(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->update($id, $request, $validator);
    }

    #[Route('/{id}', name: 'remove', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function removeAction(int $id): JsonResponse
    {
        return $this->remove($id);
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var Block $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'type_id' => $entity->getType()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Block $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'sections' => $entity->isSections(),
            'property' => $entity->isProperty(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'type_id' => $entity->getType()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $data): object
    {
        $block = new Block();
        $this->applyBlockData($block, $data);

        return $block;
    }

    protected function updateEntity(object $entity, array $data): void
    {
        /** @var Block $entity */
        $this->applyBlockData($entity, $data);
    }

    protected function serializeRemoved(object $entity): array
    {
        /** @var Block $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
        ];
    }

    private function applyBlockData(Block $block, array $data): void
    {
        if (array_key_exists('code', $data)) {
            $block->setCode((string) $data['code']);
        }
        if (array_key_exists('name', $data)) {
            $block->setName((string) $data['name']);
        }
        if (array_key_exists('description', $data)) {
            $block->setDescription($data['description']);
        }
        if (array_key_exists('sort', $data)) {
            $block->setSort((int) $data['sort']);
        }
        if (array_key_exists('active', $data)) {
            $block->setActive((bool) $data['active']);
        }
        if (array_key_exists('sections', $data)) {
            $block->setSections((bool) $data['sections']);
        }
        if (array_key_exists('property', $data)) {
            $block->setProperty((bool) $data['property']);
        }
        if (array_key_exists('active_from', $data)) {
            $block->setActiveFrom($this->parseDate($data['active_from']));
        }
        if (array_key_exists('active_to', $data)) {
            $block->setActiveTo($this->parseDate($data['active_to']));
        }
        if (array_key_exists('type_id', $data)) {
            $type = null;
            if (null !== $data['type_id'] && '' !== $data['type_id']) {
                $type = $this->typeRepository->find((int) $data['type_id']);
            }
            $block->setType($type);
        }
    }
}
