<?php

namespace IncCom\Controller;

use IncCom\DTO\DtoValidator;
use IncCom\DTO\Request\CreateAccountRequest;
use IncCom\Entity\Account;
use IncCom\Repository\AccountRepository;
use IncCom\Security\Voter\AccountVoter;
use IncCom\Service\AccountAccessService;
use IncCom\Service\IncComManager;
use IncCom\Service\PaginationService;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/accounts', name: 'api_accounts_')]
class AccountsController extends AbstractController
{
    public function __construct(
        private readonly AccountRepository $accountRepository,
        private readonly AccountAccessService $accountAccessService,
        private readonly PaginationService $paginationService,
        private readonly IncComManager $incComManager,
        private readonly UserRepository $userRepository,
        private readonly DtoValidator $dtoValidator,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $size = $this->paginationService->normalizeSize((int) $request->query->get('size', PaginationService::DEFAULT_SIZE));

        $filters = ['accessibleTo' => $user->getId()];
        if ($request->query->has('type')) {
            $filters['type'] = $request->query->get('type');
        }
        if ($request->query->has('currency')) {
            $filters['currency'] = $request->query->get('currency');
        }

        $sort = [
            ['key' => 'sort', 'order' => 'ASC'],
            ['key' => 'label', 'order' => 'ASC'],
        ];

        $paginated = $this->paginationService->paginate(
            $this->accountRepository,
            $page,
            $size,
            $filters,
            $sort,
        );

        $items = array_map(
            fn (Account $account) => $this->mapAccount($account, $user),
            $paginated->items,
        );

        return $this->json([
            'items' => $items,
            'total' => $paginated->total,
            'page' => $paginated->page,
            'size' => $paginated->size,
            'pages' => $paginated->pages,
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $this->dtoValidator->validate($request->toArray(), CreateAccountRequest::class);
        } catch (ValidationFailedException $e) {
            return $this->dtoValidator->toJsonResponse($e);
        }

        $data = $this->mapAccountRequestToLegacy($request->toArray());
        $data['owner_id'] = $user->getId();

        $this->incComManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $account = $this->incComManager->account(0, $data);
            $this->incComManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $this->incComManager->getEntityManager()->getConnection()->rollBack();

            return $this->validationErrorResponse($e);
        }

        return $this->json($this->mapAccount($account, $user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function detail(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($id);
        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);

        return $this->json($this->mapAccount($account, $user));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($id);
        $this->denyAccessUnlessGranted(AccountVoter::EDIT, $account);

        $data = $this->mapAccountRequestToLegacy($request->toArray());
        unset($data['balance']);

        $this->incComManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $account = $this->incComManager->account($account, $data);
            $this->incComManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $this->incComManager->getEntityManager()->getConnection()->rollBack();

            return $this->validationErrorResponse($e);
        }

        return $this->json($this->mapAccount($account, $user));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function remove(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($id);
        $this->denyAccessUnlessGranted(AccountVoter::DELETE, $account);

        try {
            $this->incComManager->deleteAccountEntity($account);
        } catch (\LogicException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_CONFLICT);
        }

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/users', name: 'add_user', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addUser(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($id);
        $this->denyAccessUnlessGranted(AccountVoter::MANAGE_USERS, $account);

        $body = $request->toArray();
        $participant = $this->resolveParticipantUser($body);
        if ($participant === null) {
            return $this->json([
                'error' => 'Validation failed',
                'violations' => ['userId' => 'User not found'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($this->accountAccessService->isMaster($account, $participant)) {
            return $this->json([
                'error' => 'User is already the account master',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($this->accountAccessService->isParticipant($account, $participant)) {
            return $this->json([
                'error' => 'User is already a participant',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $account->addUser($participant);
        $this->accountRepository->save($account, true);

        return $this->json([
            'userId' => $participant->getId(),
            'login' => $participant->getLogin(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}/users/{userId}', name: 'remove_user', methods: ['DELETE'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    public function removeUser(int $id, int $userId, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($id);
        $this->denyAccessUnlessGranted(AccountVoter::MANAGE_USERS, $account);

        $participant = $this->userRepository->find($userId);
        if ($participant === null) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        if ($this->accountAccessService->isMaster($account, $participant)) {
            return $this->json([
                'error' => 'Cannot remove the account master',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$account->getUsers()->contains($participant)) {
            return $this->json(['error' => 'User is not a participant'], Response::HTTP_NOT_FOUND);
        }

        $account->removeUser($participant);
        $this->accountRepository->save($account, true);

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    private function findAccountOr404(int $id): Account
    {
        $account = $this->accountRepository->find($id);
        if ($account === null) {
            throw $this->createNotFoundException('Account not found');
        }

        return $account;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function mapAccountRequestToLegacy(array $data): array
    {
        $mapped = [];

        if (array_key_exists('label', $data)) {
            $mapped['label'] = $data['label'];
        } elseif (array_key_exists('name', $data)) {
            $mapped['label'] = $data['name'];
        }
        if (array_key_exists('order', $data)) {
            $mapped['sort'] = $data['order'];
        }
        foreach (['description', 'currency', 'type', 'color', 'icon', 'number', 'balance'] as $field) {
            if (array_key_exists($field, $data)) {
                $mapped[$field] = $data[$field];
            }
        }

        return $mapped;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAccount(Account $account, User $user): array
    {
        $isMaster = $this->accountAccessService->isMaster($account, $user);
        $master = $account->getMaster();

        $result = [
            'id' => $account->getId(),
            'label' => $account->getLabel(),
            'description' => $account->getDescription(),
            'currency' => $account->getCurrency(),
            'type' => $account->getType(),
            'order' => $account->getSort(),
            'color' => $account->getColor(),
            'icon' => $account->getIcon(),
            'number' => $isMaster ? $account->getNumber() : null,
            'balance' => $account->getBalance(),
            'masterId' => $master?->getId(),
            'isMaster' => $isMaster,
            'createdAt' => $this->formatDateTime($account->getCreatedAt()),
            'updatedAt' => $this->formatDateTime($account->getXTimestamp()),
        ];

        if ($isMaster) {
            $result['participants'] = array_map(
                fn ($u) => ['id' => $u->getId(), 'login' => $u->getLogin()],
                $account->getUsers()->toArray(),
            );
        } else {
            $result['ownerId'] = $master?->getId();
            $result['owner'] = $this->formatUserDisplayName($master);
        }

        return $result;
    }

    private function formatUserDisplayName(?User $user): ?string
    {
        if ($user === null) {
            return null;
        }

        $alias = $user->getAlias();
        if ($alias !== null && trim($alias) !== '') {
            return trim($alias);
        }

        return $user->getLogin();
    }

    /**
     * @param array<string, mixed> $body
     */
    private function resolveParticipantUser(array $body): ?User
    {
        if (isset($body['userId'])) {
            return $this->userRepository->find((int) $body['userId']);
        }

        if (isset($body['login']) && is_string($body['login']) && $body['login'] !== '') {
            return $this->userRepository->findOneBy(['login' => $body['login']]);
        }

        return null;
    }

    private function formatDateTime(\DateTimeInterface|string|null $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        return $value->format(\DateTimeInterface::ATOM);
    }

    private function validationErrorResponse(ValidationFailedException $e): JsonResponse
    {
        $violations = $this->incComManager->parseViolation($e->getViolations());

        return $this->json([
            'error' => 'Validation failed',
            'violations' => $violations,
        ], Response::HTTP_BAD_REQUEST);
    }
}
