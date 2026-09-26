<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Attribute\Access;
use Assets\Entity\Contract;
use Assets\Repository\ContractRepository;
use Assets\Repository\CounterpartyRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/assets/contracts')]
#[Access('assets.contract')]
class ContractController extends AssetsCrudController
{
    public function __construct(
        private readonly ContractRepository $repository,
        private readonly CounterpartyRepository $partyRepository,
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

    /** @param Contract $entity */
    protected function serializeListItem(object $entity): array
    {
        $party = $entity->getParty();

        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'number' => $entity->getNumber(),
            'party_id' => $party?->getId(),
            'party' => $party?->getName(),
            'date_from' => $this->formatDate($entity->getDateFrom()),
            'date_to' => $this->formatDate($entity->getDateTo()),
            'amount' => $entity->getAmount(),
            'sort' => $entity->getSort(),
        ];
    }

    /** @param Contract $entity */
    protected function serializeDetail(object $entity): array
    {
        $party = $entity->getParty();

        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
            'number' => $entity->getNumber(),
            'party_id' => $party?->getId(),
            'party' => $party?->getName(),
            'date_from' => $this->formatDate($entity->getDateFrom()),
            'date_to' => $this->formatDate($entity->getDateTo()),
            'amount' => $entity->getAmount(),
            'notes' => $entity->getNotes(),
            'sort' => $entity->getSort(),
        ];
    }

    protected function createEntity(array $data): object
    {
        $entity = new Contract();
        $this->applyData($entity, $data);

        return $entity;
    }

    /** @param Contract $entity */
    protected function updateEntity(object $entity, array $data): void
    {
        $this->applyData($entity, $data);
    }

    /** @param Contract $entity */
    protected function serializeRemoved(object $entity): array
    {
        return [
            'id' => $entity->getId(),
            'name' => $entity->getName(),
        ];
    }

    private function applyData(Contract $entity, array $data): void
    {
        if (\array_key_exists('name', $data)) {
            $entity->setName(trim((string) $data['name']));
        }
        if (\array_key_exists('number', $data)) {
            $entity->setNumber($this->nullableString($data['number']));
        }
        if (\array_key_exists('party_id', $data)) {
            $partyId = $this->nullableInt($data['party_id']);
            $entity->setParty($partyId ? $this->partyRepository->find($partyId) : null);
        }
        if (\array_key_exists('date_from', $data)) {
            $entity->setDateFrom($this->parseDate($data['date_from']));
        }
        if (\array_key_exists('date_to', $data)) {
            $entity->setDateTo($this->parseDate($data['date_to']));
        }
        if (\array_key_exists('amount', $data)) {
            $entity->setAmount($this->nullableDecimal($data['amount']));
        }
        if (\array_key_exists('notes', $data)) {
            $entity->setNotes($this->nullableString($data['notes']));
        }
        if (\array_key_exists('sort', $data)) {
            $entity->setSort((int) $data['sort']);
        }
    }
}
