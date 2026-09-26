<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Attribute\Access;
use Assets\Entity\FleetVehicle;
use Assets\Repository\FleetVehicleRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Service\OuScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/assets/fleet')]
#[Access('assets.fleet')]
class FleetController extends AssetsCrudController
{
    public function __construct(
        private readonly FleetVehicleRepository $repository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->repository;
    }

    #[Route('/list', methods: ['POST'])]
    #[Access('can_read')]
    public function list(Request $request, OuScope $ouScope, #[CurrentUser] User $user): JsonResponse
    {
        return $this->listAction($request, $ouScope, $user);
    }

    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('can_read')]
    public function detail(int $id): JsonResponse
    {
        return $this->detailAction($id);
    }

    #[Route('/', methods: ['POST'])]
    #[Access('can_create')]
    public function create(
        Request $request,
        ValidatorInterface $validator,
        OuScope $ouScope,
        EntityManagerInterface $em,
        #[CurrentUser] User $user,
    ): JsonResponse {
        return $this->createAction($request, $validator, $ouScope, $em, $user);
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

    /** @param FleetVehicle $entity */
    protected function serializeListItem(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'plate' => $entity->getPlate(),
            'brand' => $entity->getBrand(),
            'model' => $entity->getModel(),
            'year' => $entity->getYear(),
            'sort' => $entity->getSort(),
        ];
    }

    /** @param FleetVehicle $entity */
    protected function serializeDetail(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'plate' => $entity->getPlate(),
            'vin' => $entity->getVin(),
            'brand' => $entity->getBrand(),
            'model' => $entity->getModel(),
            'year' => $entity->getYear(),
            'notes' => $entity->getNotes(),
            'sort' => $entity->getSort(),
        ];
    }

    protected function createEntity(array $data): object
    {
        $entity = new FleetVehicle();
        $this->applyData($entity, $data);

        return $entity;
    }

    /** @param FleetVehicle $entity */
    protected function updateEntity(object $entity, array $data): void
    {
        $this->applyData($entity, $data);
    }

    /** @param FleetVehicle $entity */
    protected function serializeRemoved(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
        ];
    }

    private function applyData(FleetVehicle $entity, array $data): void
    {
        if (\array_key_exists('name', $data)) {
            $entity->setName(trim((string) $data['name']));
        }
        if (\array_key_exists('plate', $data)) {
            $entity->setPlate($this->nullableString($data['plate']));
        }
        if (\array_key_exists('vin', $data)) {
            $entity->setVin($this->nullableString($data['vin']));
        }
        if (\array_key_exists('brand', $data)) {
            $entity->setBrand($this->nullableString($data['brand']));
        }
        if (\array_key_exists('model', $data)) {
            $entity->setModel($this->nullableString($data['model']));
        }
        if (\array_key_exists('year', $data)) {
            $entity->setYear($this->nullableInt($data['year']));
        }
        if (\array_key_exists('notes', $data)) {
            $entity->setNotes($this->nullableString($data['notes']));
        }
        if (\array_key_exists('sort', $data)) {
            $entity->setSort((int) $data['sort']);
        }
    }
}
