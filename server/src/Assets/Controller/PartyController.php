<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Attribute\Access;
use Assets\Entity\Counterparty;
use Assets\Repository\CounterpartyRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Service\OuScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/assets/parties')]
#[Access('assets.party')]
class PartyController extends AssetsCrudController
{
    public function __construct(
        private readonly CounterpartyRepository $repository,
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

    /** @param Counterparty $entity */
    protected function serializeListItem(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'inn' => $entity->getInn(),
            'phone' => $entity->getPhone(),
            'email' => $entity->getEmail(),
            'sort' => $entity->getSort(),
        ];
    }

    /** @param Counterparty $entity */
    protected function serializeDetail(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'inn' => $entity->getInn(),
            'phone' => $entity->getPhone(),
            'email' => $entity->getEmail(),
            'notes' => $entity->getNotes(),
            'sort' => $entity->getSort(),
        ];
    }

    protected function createEntity(array $data): object
    {
        $entity = new Counterparty();
        $this->applyData($entity, $data);

        return $entity;
    }

    /** @param Counterparty $entity */
    protected function updateEntity(object $entity, array $data): void
    {
        $this->applyData($entity, $data);
    }

    /** @param Counterparty $entity */
    protected function serializeRemoved(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
        ];
    }

    private function applyData(Counterparty $entity, array $data): void
    {
        if (\array_key_exists('name', $data)) {
            $entity->setName(trim((string) $data['name']));
        }
        if (\array_key_exists('inn', $data)) {
            $entity->setInn($this->nullableString($data['inn']));
        }
        if (\array_key_exists('phone', $data)) {
            $entity->setPhone($this->nullableString($data['phone']));
        }
        if (\array_key_exists('email', $data)) {
            $entity->setEmail($this->nullableString($data['email']));
        }
        if (\array_key_exists('notes', $data)) {
            $entity->setNotes($this->nullableString($data['notes']));
        }
        if (\array_key_exists('sort', $data)) {
            $entity->setSort((int) $data['sort']);
        }
    }
}
