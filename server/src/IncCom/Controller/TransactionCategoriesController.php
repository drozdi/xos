<?php

namespace IncCom\Controller;

use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Repository\AccountRepository;
use IncCom\Repository\CategoryRepository;
use IncCom\Security\Voter\AccountVoter;
use IncCom\Security\Voter\TransactionCategoryVoter;
use IncCom\Service\IncComManager;
use IncCom\Service\PaginationService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/accounts/{accountId}/categories', name: 'api_transaction_categories_', requirements: ['accountId' => '\d+'])]
class TransactionCategoriesController extends AbstractController
{
    public function __construct(
        private readonly AccountRepository $accountRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly PaginationService $paginationService,
        private readonly IncComManager $incComManager,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(int $accountId, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($accountId);
        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);

        $page = max(1, (int) $request->query->get('page', 1));
        $size = $this->paginationService->normalizeSize((int) $request->query->get('size', PaginationService::DEFAULT_SIZE));

        $filters = ['account' => $accountId];
        if ($request->query->has('type')) {
            $filters['type'] = $request->query->get('type');
        }
        if ($request->query->has('createdBy')) {
            $filters['createdBy'] = (int) $request->query->get('createdBy');
        }

        $sort = [
            ['key' => 'sort', 'order' => 'ASC'],
            ['key' => 'label', 'order' => 'ASC'],
        ];

        $paginated = $this->paginationService->paginate(
            $this->categoryRepository,
            $page,
            $size,
            $filters,
            $sort,
        );

        $items = array_map(
            fn (Category $category) => $this->mapCategory($category),
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
    public function create(int $accountId, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $account = $this->findAccountOr404($accountId);
        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);

        $data = $this->mapCategoryRequestToLegacy($request->toArray());
        $data['account_id'] = $accountId;
        $data['created_by_id'] = $user->getId();

        $this->incComManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $category = $this->incComManager->category(0, $data);
            $this->incComManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $this->incComManager->getEntityManager()->getConnection()->rollBack();

            return $this->validationErrorResponse($e);
        }

        return $this->json($this->mapCategory($category), Response::HTTP_CREATED);
    }

    #[Route('/copy', name: 'copy', methods: ['POST'])]
    public function copy(int $accountId, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $body = $request->toArray();
        $targetAccountId = isset($body['targetAccountId']) ? (int) $body['targetAccountId'] : 0;
        if ($targetAccountId <= 0) {
            return $this->json([
                'error' => 'Validation failed',
                'violations' => ['targetAccountId' => 'Target account is required'],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $type = isset($body['type']) && is_string($body['type']) ? $body['type'] : null;
        $categoryIds = isset($body['categoryIds']) && is_array($body['categoryIds'])
            ? array_map('intval', $body['categoryIds'])
            : null;

        try {
            $result = $this->incComManager->copyCategories(
                $accountId,
                $targetAccountId,
                $user,
                $type,
                $categoryIds,
            );
        } catch (AccessDeniedException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'copied' => count($result['copied']),
            'skipped' => $result['skipped'],
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $accountId, int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $category = $this->findCategoryInAccountOr404($accountId, $id);
        $this->denyAccessUnlessGranted(TransactionCategoryVoter::EDIT, $category);

        $data = $this->mapCategoryRequestToLegacy($request->toArray());

        $this->incComManager->getEntityManager()->getConnection()->beginTransaction();
        try {
            $category = $this->incComManager->category($category, $data);
            $this->incComManager->getEntityManager()->getConnection()->commit();
        } catch (ValidationFailedException $e) {
            $this->incComManager->getEntityManager()->getConnection()->rollBack();

            return $this->validationErrorResponse($e);
        }

        return $this->json($this->mapCategory($category));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function remove(int $accountId, int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $category = $this->findCategoryInAccountOr404($accountId, $id);
        $this->denyAccessUnlessGranted(TransactionCategoryVoter::DELETE, $category);

        try {
            $this->incComManager->deleteCategoryEntity($category);
        } catch (\LogicException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    private function findAccountOr404(int $accountId): Account
    {
        $account = $this->accountRepository->find($accountId);
        if ($account === null) {
            throw $this->createNotFoundException('Account not found');
        }

        return $account;
    }

    private function findCategoryInAccountOr404(int $accountId, int $id): Category
    {
        $category = $this->categoryRepository->find($id);
        if ($category === null || $category->getAccount()?->getId() !== $accountId) {
            throw $this->createNotFoundException('Category not found');
        }

        return $category;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function mapCategoryRequestToLegacy(array $data): array
    {
        $mapped = [];

        if (array_key_exists('name', $data)) {
            $mapped['label'] = $data['name'];
        }
        if (array_key_exists('order', $data)) {
            $mapped['sort'] = $data['order'];
        }
        if (array_key_exists('type', $data)) {
            $mapped['type'] = $data['type'];
        }

        return $mapped;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapCategory(Category $category): array
    {
        return [
            'id' => $category->getId(),
            'name' => $category->getLabel(),
            'type' => $category->getType(),
            'order' => $category->getSort(),
            'accountId' => $category->getAccount()?->getId(),
            'createdById' => $category->getCreatedBy()?->getId(),
            'createdAt' => $this->formatDateTime($category->getCreatedAt()),
            'updatedAt' => $this->formatDateTime($category->getXTimestamp()),
        ];
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
