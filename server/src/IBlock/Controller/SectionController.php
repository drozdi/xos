<?php

namespace IBlock\Controller;

use App\Attribute\Access;
use AbstractRepository;
use IBlock\Entity\Section;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\SectionRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/iblock/section', name: 'api_iblock_section_')]
#[Access('iblock.section')]
class SectionController extends IBlockCrudController
{
    public function __construct(
        private readonly SectionRepository $sectionRepository,
        private readonly BlockRepository $blockRepository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->sectionRepository;
    }

    protected function getListAlias(): string
    {
        return 's';
    }

    #[Route('/list', name: 'list', methods: ['POST'])]
    #[Access('can_read')]
    public function listAction(Request $request): JsonResponse
    {
        return $this->list($request);
    }

    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'], requirements: ['id' => '\d+'])]
    #[Access('can_read')]
    public function detailAction(int $id): JsonResponse
    {
        return $this->detail($id);
    }

    #[Route('/', name: 'create', methods: ['POST'])]
    #[Access('can_create')]
    public function createAction(Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->create($request, $validator);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('can_update')]
    public function updateAction(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->update($id, $request, $validator);
    }

    #[Route('/{id}', name: 'remove', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('can_delete')]
    public function removeAction(int $id): JsonResponse
    {
        return $this->remove($id);
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var Section $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'level' => $entity->getLevel(),
            'block_id' => $entity->getBlock()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Section $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'level' => $entity->getLevel(),
            'active' => $entity->isActive(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'parent_id' => $entity->getParent()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $data): object
    {
        $section = new Section();
        $this->applySectionData($section, $data);

        return $section;
    }

    protected function updateEntity(object $entity, array $data): void
    {
        /** @var Section $entity */
        $this->applySectionData($entity, $data);
    }

    protected function serializeRemoved(object $entity): array
    {
        /** @var Section $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
        ];
    }

    private function applySectionData(Section $section, array $data): void
    {
        if (array_key_exists('code', $data)) {
            $section->setCode((string) $data['code']);
        }
        if (array_key_exists('name', $data)) {
            $section->setName((string) $data['name']);
        }
        if (array_key_exists('description', $data)) {
            $section->setDescription($data['description']);
        }
        if (array_key_exists('sort', $data)) {
            $section->setSort((int) $data['sort']);
        }
        if (array_key_exists('level', $data)) {
            $section->setLevel((int) $data['level']);
        }
        if (array_key_exists('active', $data)) {
            $section->setActive((bool) $data['active']);
        }
        if (array_key_exists('active_from', $data)) {
            $section->setActiveFrom($this->parseDate($data['active_from']));
        }
        if (array_key_exists('active_to', $data)) {
            $section->setActiveTo($this->parseDate($data['active_to']));
        }
        if (array_key_exists('block_id', $data)) {
            $block = null;
            if (null !== $data['block_id'] && '' !== $data['block_id']) {
                $block = $this->blockRepository->find((int) $data['block_id']);
            }
            $section->setBlock($block);
        }
        if (array_key_exists('parent_id', $data)) {
            $parent = null;
            if (null !== $data['parent_id'] && '' !== $data['parent_id']) {
                $parent = $this->sectionRepository->find((int) $data['parent_id']);
            }
            $section->setParent($parent);
        }
    }
}
