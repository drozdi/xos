<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Attribute\Access;
use Assets\Entity\SoftPackage;
use Assets\Repository\SoftPackageRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/assets/software')]
#[Access('assets.software')]
class SoftController extends AssetsCrudController
{
    public function __construct(
        private readonly SoftPackageRepository $repository,
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

    /** @param SoftPackage $entity */
    protected function serializeListItem(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'vendor' => $entity->getVendor(),
            'version' => $entity->getVersion(),
            'license_type' => $entity->getLicenseType(),
            'seats' => $entity->getSeats(),
            'sort' => $entity->getSort(),
        ];
    }

    /** @param SoftPackage $entity */
    protected function serializeDetail(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'vendor' => $entity->getVendor(),
            'version' => $entity->getVersion(),
            'license_type' => $entity->getLicenseType(),
            'seats' => $entity->getSeats(),
            'notes' => $entity->getNotes(),
            'sort' => $entity->getSort(),
        ];
    }

    protected function createEntity(array $data): object
    {
        $entity = new SoftPackage();
        $this->applyData($entity, $data);

        return $entity;
    }

    /** @param SoftPackage $entity */
    protected function updateEntity(object $entity, array $data): void
    {
        $this->applyData($entity, $data);
    }

    /** @param SoftPackage $entity */
    protected function serializeRemoved(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
        ];
    }

    private function applyData(SoftPackage $entity, array $data): void
    {
        if (\array_key_exists('name', $data)) {
            $entity->setName(trim((string) $data['name']));
        }
        if (\array_key_exists('vendor', $data)) {
            $entity->setVendor($this->nullableString($data['vendor']));
        }
        if (\array_key_exists('version', $data)) {
            $entity->setVersion($this->nullableString($data['version']));
        }
        if (\array_key_exists('license_type', $data)) {
            $entity->setLicenseType($this->nullableString($data['license_type']));
        }
        if (\array_key_exists('seats', $data)) {
            $entity->setSeats($this->nullableInt($data['seats']));
        }
        if (\array_key_exists('notes', $data)) {
            $entity->setNotes($this->nullableString($data['notes']));
        }
        if (\array_key_exists('sort', $data)) {
            $entity->setSort((int) $data['sort']);
        }
    }
}
