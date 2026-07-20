<?php

namespace IBlock\Controller;

use App\Attribute\Access;
use AbstractRepository;
use IBlock\Entity\Element;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\ElementRepository;
use IBlock\Repository\SectionRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/iblock/element', name: 'api_iblock_element_')]
#[Access('iblock.element')]
class ElementController extends IBlockCrudController
{
    public function __construct(
        private readonly ElementRepository $elementRepository,
        private readonly BlockRepository $blockRepository,
        private readonly SectionRepository $sectionRepository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->elementRepository;
    }

    protected function getListAlias(): string
    {
        return 'e';
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
        /** @var Element $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'block_id' => $entity->getBlock()?->getId(),
            'section_id' => $entity->getSection()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Element $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'preview_text' => $entity->getPreviewText(),
            'detail_text' => $entity->getDetailText(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'section_id' => $entity->getSection()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $data): object
    {
        $element = new Element();
        $this->applyElementData($element, $data);

        return $element;
    }

    protected function updateEntity(object $entity, array $data): void
    {
        /** @var Element $entity */
        $this->applyElementData($entity, $data);
    }

    protected function serializeRemoved(object $entity): array
    {
        /** @var Element $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
        ];
    }

    private function applyElementData(Element $element, array $data): void
    {
        if (array_key_exists('code', $data)) {
            $element->setCode((string) $data['code']);
        }
        if (array_key_exists('name', $data)) {
            $element->setName((string) $data['name']);
        }
        if (array_key_exists('description', $data)) {
            $element->setDescription($data['description']);
        }
        if (array_key_exists('preview_text', $data)) {
            $element->setPreviewText($data['preview_text']);
        }
        if (array_key_exists('detail_text', $data)) {
            $element->setDetailText($data['detail_text']);
        }
        if (array_key_exists('sort', $data)) {
            $element->setSort((int) $data['sort']);
        }
        if (array_key_exists('active', $data)) {
            $element->setActive((bool) $data['active']);
        }
        if (array_key_exists('active_from', $data)) {
            $element->setActiveFrom($this->parseDate($data['active_from']));
        }
        if (array_key_exists('active_to', $data)) {
            $element->setActiveTo($this->parseDate($data['active_to']));
        }
        if (array_key_exists('block_id', $data)) {
            $block = null;
            if (null !== $data['block_id'] && '' !== $data['block_id']) {
                $block = $this->blockRepository->find((int) $data['block_id']);
            }
            $element->setBlock($block);
        }
        if (array_key_exists('section_id', $data)) {
            $section = null;
            if (null !== $data['section_id'] && '' !== $data['section_id']) {
                $section = $this->sectionRepository->find((int) $data['section_id']);
            }
            $element->setSection($section);
        }
    }
}
