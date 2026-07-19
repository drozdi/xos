<?php



namespace IncCom\Controller;



use IncCom\DTO\DtoValidator;
use IncCom\DTO\Request\CreateTransferRequest;
use IncCom\Entity\Account;

use IncCom\Entity\Transfer;

use IncCom\Repository\AccountRepository;

use IncCom\Repository\TransferRepository;

use IncCom\Security\Voter\AccountVoter;

use IncCom\Security\Voter\TransferVoter;

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



#[Route('/api/transfers', name: 'api_transfers_')]

class TransfersController extends AbstractController

{

    public function __construct(

        private readonly AccountRepository $accountRepository,

        private readonly TransferRepository $transferRepository,

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



        $page = max(1, (int) $request->query->get('page', 1));

        $size = $this->paginationService->normalizeSize((int) $request->query->get('size', PaginationService::DEFAULT_SIZE));



        $filters = ['accessibleTo' => $user->getId()];

        if ($request->query->has('fromAccount')) {

            $filters['fromAccount'] = (int) $request->query->get('fromAccount');

        }

        if ($request->query->has('toAccount')) {

            $filters['toAccount'] = (int) $request->query->get('toAccount');

        }

        if ($request->query->has('dateFrom')) {

            $filters['dateFrom'] = $request->query->get('dateFrom');

        }

        if ($request->query->has('dateTo')) {

            $filters['dateTo'] = $request->query->get('dateTo');

        }



        $sort = [['key' => 'date', 'order' => 'DESC']];



        $paginated = $this->paginationService->paginate(

            $this->transferRepository,

            $page,

            $size,

            $filters,

            $sort,

        );



        $items = array_map(

            fn (Transfer $transfer) => $this->mapTransfer($transfer),

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

            $this->dtoValidator->validate($request->toArray(), CreateTransferRequest::class);

        } catch (ValidationFailedException $e) {

            return $this->dtoValidator->toJsonResponse($e);

        }



        $data = $request->toArray();

        $fromAccount = $this->resolveAccountId($data['fromAccountId'] ?? null);

        $toAccount = $this->resolveAccountId($data['toAccountId'] ?? null);



        if ($fromAccount === null) {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['fromAccountId' => 'From account is required'],

            ], Response::HTTP_BAD_REQUEST);

        }

        if ($toAccount === null) {

            return $this->json([

                'error' => 'Validation failed',

                'violations' => ['toAccountId' => 'To account is required'],

            ], Response::HTTP_BAD_REQUEST);

        }



        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $fromAccount);

        $this->denyAccessUnlessGranted(AccountVoter::VIEW, $toAccount);



        try {

            $transfer = $this->incComManager->createTransfer($data, $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        } catch (\InvalidArgumentException $e) {

            return $this->mapInvalidArgumentResponse($e);

        }



        return $this->json($this->mapTransfer($transfer), Response::HTTP_CREATED);

    }



    #[Route('/{id}', name: 'read', methods: ['GET'], requirements: ['id' => '\d+'])]

    public function detail(int $id, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transfer = $this->findTransferOr404($id);

        $this->denyAccessUnlessGranted(TransferVoter::VIEW, $transfer);



        return $this->json($this->mapTransfer($transfer));

    }



    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]

    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transfer = $this->findTransferOr404($id);

        $this->denyAccessUnlessGranted(TransferVoter::EDIT, $transfer);



        try {

            $transfer = $this->incComManager->updateTransfer($transfer, $request->toArray(), $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        } catch (\InvalidArgumentException $e) {

            return $this->mapInvalidArgumentResponse($e);

        }



        return $this->json($this->mapTransfer($transfer));

    }



    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]

    public function remove(int $id, #[CurrentUser] ?User $user): Response

    {

        if ($user === null) {

            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);

        }



        $transfer = $this->findTransferOr404($id);

        $this->denyAccessUnlessGranted(TransferVoter::DELETE, $transfer);



        try {

            $this->incComManager->deleteTransfer($transfer, $user);

        } catch (AccessDeniedException $e) {

            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);

        }



        return new Response('', Response::HTTP_NO_CONTENT);

    }



    private function findTransferOr404(int $id): Transfer

    {

        $transfer = $this->transferRepository->find($id);

        if ($transfer === null) {

            throw $this->createNotFoundException('Transfer not found');

        }



        return $transfer;

    }



    /**

     * @param mixed $accountId

     */

    private function resolveAccountId(mixed $accountId): ?Account

    {

        if ($accountId === null) {

            return null;

        }



        $id = (int) $accountId;

        if ($id <= 0) {

            return null;

        }



        return $this->accountRepository->find($id);

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

    private function mapTransfer(Transfer $transfer): array

    {

        return [

            'id' => $transfer->getId(),

            'amount' => $transfer->getAmount(),

            'date' => $this->formatDateTime($transfer->getDate()),

            'comment' => $transfer->getComment(),

            'fromAccountId' => $transfer->getFromAccount()->getId(),

            'toAccountId' => $transfer->getToAccount()->getId(),

            'authorId' => $transfer->getAuthor()?->getId(),

            'outgoingTransactionId' => $transfer->getOutgoingTransaction()?->getId(),

            'incomingTransactionId' => $transfer->getIncomingTransaction()?->getId(),

            'outgoingCategoryId' => $transfer->getOutgoingTransaction()?->getCategory()?->getId(),

            'incomingCategoryId' => $transfer->getIncomingTransaction()?->getCategory()?->getId(),

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


