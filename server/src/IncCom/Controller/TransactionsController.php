<?php



namespace IncCom\Controller;



use IncCom\DTO\DtoValidator;
use IncCom\DTO\Request\CreateTransactionRequest;
use IncCom\Entity\Account;

use IncCom\Entity\Transaction;

use IncCom\Entity\TransactionItem;

use IncCom\Repository\AccountRepository;

use IncCom\Repository\TransactionRepository;

use IncCom\Security\Voter\AccountVoter;

use IncCom\Security\Voter\TransactionVoter;

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



#[Route('/api/transactions', name: 'api_transactions_')]

class TransactionsController extends AbstractController

{

    public function __construct(

        private readonly AccountRepository $accountRepository,

        private readonly TransactionRepository $transactionRepository,

        private readonly PaginationService $paginationService,

        private readonly IncComManager $incComManager,

        private readonly DtoValidator $dtoValidator,

    ) {

    }



    #[Route('', name: 'list', methods: ['GET'])]

    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        if (!$request->query->has('account')) {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['account' => 'Account is required'],

            ], Response::HTTP_BAD_REQUEST);

        }



        $accountId = (int) $request->query->get('account');

        if ($accountId <= 0) {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['account' => 'Invalid account'],

            ], Response::HTTP_BAD_REQUEST);

        }



        $account = $this->findAccountOr404($accountId);

        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);



        $page = max(1, (int) $request->query->get('page', 1));

        $size = $this->paginationService->normalizeSize((int) $request->query->get('size', PaginationService::DEFAULT_SIZE));



        $filters = ['account' => $accountId];

        if ($request->query->has('type')) {

            $filters['type'] = $request->query->get('type');

        }

        if ($request->query->has('category')) {

            $filters['category'] = (int) $request->query->get('category');

        }

        if ($request->query->has('dateFrom')) {

            $filters['dateFrom'] = $request->query->get('dateFrom');

        }

        if ($request->query->has('dateTo')) {

            $filters['dateTo'] = $request->query->get('dateTo');

        }

        if ($request->query->has('mcc')) {

            $filters['mcc'] = $request->query->get('mcc');

        }

        if ($request->query->has('author')) {

            $filters['author'] = (int) $request->query->get('author');

        }



        $sort = [['key' => 'date', 'order' => 'DESC']];



        $paginated = $this->paginationService->paginate(

            $this->transactionRepository,

            $page,

            $size,

            $filters,

            $sort,

        );



        $items = array_map(

            fn (Transaction $transaction) => $this->mapTransaction($transaction),

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

            $this->dtoValidator->validate($request->toArray(), CreateTransactionRequest::class);

        } catch (ValidationFailedException $e) {

            return $this->dtoValidator->toJsonResponse($e);

        }



        $data = $this->mapTransactionRequestToService($request->toArray());

        $account = $this->resolveAccountFromData($data);

        if ($account === null) {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['accountId' => 'Account is required'],

            ], Response::HTTP_BAD_REQUEST);

        }

        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);



        try {

            $transaction = $this->incComManager->createTransaction($data, $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        } catch (\InvalidArgumentException $e) {

            return $this->mapInvalidArgumentResponse($e);

        }



        return $this->json($this->mapTransaction($transaction), Response::HTTP_CREATED);

    }



    #[Route('/{id}', name: 'read', methods: ['GET'], requirements: ['id' => '\d+'])]

    public function detail(int $id, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transaction = $this->findTransactionOr404($id);

        $this->denyAccessUnlessGranted(TransactionVoter::VIEW, $transaction);



        return $this->json($this->mapTransaction($transaction));

    }



    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]

    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transaction = $this->findTransactionOr404($id);

        $this->denyAccessUnlessGranted(TransactionVoter::EDIT, $transaction);



        $data = $this->mapTransactionRequestToService($request->toArray());

        if (isset($data['account'])) {

            $account = $this->accountRepository->find($data['account']);

            if ($account !== null) {

                $this->denyAccessUnlessGranted(AccountVoter::VIEW, $account);

            }

        }



        try {

            $transaction = $this->incComManager->updateTransaction($transaction, $data, $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        } catch (\InvalidArgumentException $e) {

            return $this->mapInvalidArgumentResponse($e);

        }



        return $this->json($this->mapTransaction($transaction));

    }



    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]

    public function remove(int $id, #[CurrentUser] ?User $user): Response

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transaction = $this->findTransactionOr404($id);

        $this->denyAccessUnlessGranted(TransactionVoter::DELETE, $transaction);



        try {

            $this->incComManager->deleteTransaction($transaction, $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        }



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



    private function findTransactionOr404(int $id): Transaction

    {

        $transaction = $this->transactionRepository->find($id);

        if ($transaction === null) {

            throw $this->createNotFoundException('Transaction not found');

        }



        return $transaction;

    }



    /**

     * @param array<string, mixed> $data

     *

     * @return array<string, mixed>

     */

    private function mapTransactionRequestToService(array $data): array

    {

        $mapped = $data;



        if (array_key_exists('accountId', $data)) {

            $mapped['account'] = (int) $data['accountId'];

            unset($mapped['accountId']);

        }



        if (array_key_exists('categoryId', $data)) {

            $mapped['category'] = $data['categoryId'] !== null ? (int) $data['categoryId'] : null;

            unset($mapped['categoryId']);

        }



        if (array_key_exists('items', $data) && is_array($data['items'])) {

            $mapped['items'] = array_map(static function (mixed $item): array {

                if (!is_array($item)) {

                    return [];

                }

                $mappedItem = $item;

                if (array_key_exists('itemId', $item)) {

                    $mappedItem['item'] = (int) $item['itemId'];

                    unset($mappedItem['itemId']);

                }



                return $mappedItem;

            }, $data['items']);

        }



        return $mapped;

    }



    /**

     * @param array<string, mixed> $data

     */

    private function resolveAccountFromData(array $data): ?Account

    {

        if (!isset($data['account'])) {

            return null;

        }



        $accountId = (int) $data['account'];

        if ($accountId <= 0) {

            return null;

        }



        return $this->accountRepository->find($accountId);

    }



    private function mapInvalidArgumentResponse(\InvalidArgumentException $e): JsonResponse

    {

        $message = $e->getMessage();

        $status = str_contains(strtolower($message), 'not found')

            ? Response::HTTP_NOT_FOUND

            : Response::HTTP_BAD_REQUEST;



        return $this->json(['error' => $message], $status);

    }



    /**

     * @return array<string, mixed>

     */

    private function mapTransaction(Transaction $transaction): array

    {

        $items = [];

        foreach ($transaction->getItems() as $item) {

            if ($item instanceof TransactionItem) {

                $items[] = [

                    'id' => $item->getId(),

                    'itemId' => $item->getItem()->getId(),

                    'itemName' => $item->getItem()->getName(),

                    'quantity' => $item->getQuantity(),

                    'price' => $item->getPrice(),

                    'sum' => $item->getSum(),

                ];

            }

        }



        return [

            'id' => $transaction->getId(),

            'type' => $transaction->getType()->value,

            'amount' => $transaction->getAmount(),

            'date' => $this->formatDateTime($transaction->getDate()),

            'comment' => $transaction->getComment(),

            'accountId' => $transaction->getAccount()->getId(),

            'authorId' => $transaction->getAuthor()?->getId(),

            'categoryId' => $transaction->getCategory()?->getId(),

            'mcc' => $transaction->getMcc(),

            'isManualAmount' => $transaction->isManualAmount(),

            'fn' => $transaction->getFn(),

            'fpd' => $transaction->getFpd(),

            'fp' => $transaction->getFp(),

            'fd' => $transaction->getFd(),

            'transferId' => $transaction->getTransfer()?->getId(),

            'items' => $items,

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

}


