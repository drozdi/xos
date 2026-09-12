<?php

namespace IncCom\Controller;

use IncCom\Entity\Transaction;
use IncCom\Entity\TransactionItem;
use IncCom\Repository\TransactionRepository;
use IncCom\Security\Voter\TransactionVoter;
use IncCom\Service\FnsReceiptService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class FnsReceiptController extends AbstractController
{
    public function __construct(
        private readonly FnsReceiptService $fnsReceiptService,
        private readonly TransactionRepository $transactionRepository,
    ) {
    }

    #[Route('/api/IncCom/receipts/preview', name: 'api_inccom_receipts_preview', methods: ['POST'])]
    public function preview(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $result = $this->fnsReceiptService->preview($user, $request->toArray());
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Ошибка ФНС: '.$e->getMessage()], Response::HTTP_BAD_GATEWAY);
        }

        if (null === ($result['ticket'] ?? null)) {
            return $this->json([
                'check' => $result['check'] ?? null,
                'ticket' => null,
                'error' => $result['error'] ?? 'Не удалось получить чек',
            ], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'check' => $result['check'],
            'ticket' => $result['ticket'],
        ]);
    }

    #[Route('/api/IncCom/transactions/{id}/receipt/fetch', name: 'api_inccom_transactions_receipt_fetch', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function fetch(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $transaction = $this->transactionRepository->find($id);
        if (!$transaction instanceof Transaction) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted(TransactionVoter::EDIT, $transaction);

        try {
            $body = [];
            try {
                $body = $request->toArray();
            } catch (\Throwable) {
                $body = [];
            }
            $result = $this->fnsReceiptService->fetchIntoTransaction($user, $transaction, $body);
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Ошибка ФНС: '.$e->getMessage()], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json([
            'check' => $result['check'],
            'ticket' => $result['ticket'],
            'transaction' => $this->mapTransaction($result['transaction']),
        ]);
    }

    /** @return array<string, mixed> */
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
            'date' => $transaction->getDate()->format(\DateTimeInterface::ATOM),
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
            'has_receipt' => null !== $transaction->getReceiptJson(),
            'receipt_json' => $transaction->getReceiptJson(),
            'receipt_checked_at' => $transaction->getReceiptCheckedAt()?->format(\DateTimeInterface::ATOM),
            'transferId' => $transaction->getTransfer()?->getId(),
            'items' => $items,
        ];
    }
}
