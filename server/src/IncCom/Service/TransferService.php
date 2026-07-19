<?php

namespace IncCom\Service;

use Doctrine\ORM\EntityManagerInterface;
use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Entity\Transaction;
use IncCom\Entity\Transfer;
use IncCom\Enum\TransactionType;
use IncCom\Repository\AccountRepository;
use IncCom\Repository\CategoryRepository;
use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Atomic transfer CRUD: paired expense/income transactions with balance updates.
 */
class TransferService
{
    private const TRANSFER_CATEGORY_TYPE = 'transfer';

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BalanceService $balanceService,
        private readonly AccountRepository $accountRepository,
        private readonly CategoryRepository $categoryRepository,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data, User $author): Transfer
    {
        return $this->em->wrapInTransaction(function () use ($data, $author): Transfer {
            $fromAccount = $this->resolveAccount($data['fromAccount'] ?? $data['fromAccountId'] ?? null);
            $toAccount = $this->resolveAccount($data['toAccount'] ?? $data['toAccountId'] ?? null);
            $this->assertTransferAccountsValid($fromAccount, $toAccount);
            $amount = (string) ($data['amount'] ?? '');
            $date = $this->resolveDate($data['date'] ?? null);
            $comment = $data['comment'] ?? null;

            if ($amount === '' || bccomp($amount, '0', 2) <= 0) {
                throw new \InvalidArgumentException('Transfer amount must be greater than zero.');
            }

            $transfer = new Transfer();
            $transfer->setFromAccount($fromAccount);
            $transfer->setToAccount($toAccount);
            $transfer->setAmount($amount);
            $transfer->setDate($date);
            $transfer->setComment($comment);
            $transfer->setAuthor($author);

            $outgoingCategory = $this->resolveTransferCategory(
                $this->resolveCategoryId($data, 'outgoing'),
                $fromAccount,
            );
            $incomingCategory = $this->resolveTransferCategory(
                $this->resolveCategoryId($data, 'incoming'),
                $toAccount,
            );

            $outgoing = $this->buildTransaction(
                TransactionType::Expense,
                $fromAccount,
                $author,
                $amount,
                $date,
                $comment,
                $transfer,
                $outgoingCategory,
            );
            $incoming = $this->buildTransaction(
                TransactionType::Income,
                $toAccount,
                $author,
                $amount,
                $date,
                $comment,
                $transfer,
                $incomingCategory,
            );

            $transfer->setOutgoingTransaction($outgoing);
            $transfer->setIncomingTransaction($incoming);

            $this->balanceService->applyDelta($fromAccount, bcsub('0.00', $amount, 2));
            $this->balanceService->applyDelta($toAccount, $amount);

            $this->em->persist($transfer);
            $this->em->flush();

            return $transfer;
        });
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Transfer $transfer, array $data, User $author): Transfer
    {
        $this->assertAuthor($transfer, $author);

        return $this->em->wrapInTransaction(function () use ($transfer, $data): Transfer {
            $oldAmount = $transfer->getAmount();
            $fromAccount = $transfer->getFromAccount();
            $toAccount = $transfer->getToAccount();

            if (array_key_exists('amount', $data)) {
                $amount = (string) $data['amount'];
                if ($amount === '' || bccomp($amount, '0', 2) <= 0) {
                    throw new \InvalidArgumentException('Transfer amount must be greater than zero.');
                }
                $transfer->setAmount($amount);
            }

            if (array_key_exists('date', $data)) {
                $transfer->setDate($this->resolveDate($data['date']));
            }

            if (array_key_exists('comment', $data)) {
                $transfer->setComment($data['comment']);
            }

            $newAmount = $transfer->getAmount();
            $date = $transfer->getDate();
            $comment = $transfer->getComment();

            $outgoing = $transfer->getOutgoingTransaction();
            $incoming = $transfer->getIncomingTransaction();

            if ($outgoing !== null) {
                $outgoing->setAmount($newAmount);
                $outgoing->setDate($date);
                $outgoing->setComment($comment);
            }

            if ($incoming !== null) {
                $incoming->setAmount($newAmount);
                $incoming->setDate($date);
                $incoming->setComment($comment);
            }

            if ($this->hasCategoryUpdate($data, 'outgoing') && $outgoing !== null) {
                $outgoing->setCategory(
                    $this->resolveTransferCategory(
                        $this->resolveCategoryId($data, 'outgoing'),
                        $fromAccount,
                    ),
                );
            }

            if ($this->hasCategoryUpdate($data, 'incoming') && $incoming !== null) {
                $incoming->setCategory(
                    $this->resolveTransferCategory(
                        $this->resolveCategoryId($data, 'incoming'),
                        $toAccount,
                    ),
                );
            }

            if (bccomp($oldAmount, $newAmount, 2) !== 0) {
                $this->balanceService->applyDelta($fromAccount, $oldAmount);
                $this->balanceService->applyDelta($toAccount, bcsub('0.00', $oldAmount, 2));
                $this->balanceService->applyDelta($fromAccount, bcsub('0.00', $newAmount, 2));
                $this->balanceService->applyDelta($toAccount, $newAmount);
            }

            $this->em->flush();

            return $transfer;
        });
    }

    public function delete(Transfer $transfer, User $author): void
    {
        $this->assertAuthor($transfer, $author);

        $this->em->wrapInTransaction(function () use ($transfer): void {
            $amount = $transfer->getAmount();
            $fromAccount = $transfer->getFromAccount();
            $toAccount = $transfer->getToAccount();

            $this->balanceService->applyDelta($fromAccount, $amount);
            $this->balanceService->applyDelta($toAccount, bcsub('0.00', $amount, 2));

            $outgoing = $transfer->getOutgoingTransaction();
            $incoming = $transfer->getIncomingTransaction();

            if ($outgoing !== null) {
                $transfer->setOutgoingTransaction(null);
                $outgoing->setTransfer(null);
                $this->em->remove($outgoing);
            }

            if ($incoming !== null) {
                $transfer->setIncomingTransaction(null);
                $incoming->setTransfer(null);
                $this->em->remove($incoming);
            }

            $this->em->remove($transfer);
            $this->em->flush();
        });
    }

    private function buildTransaction(
        TransactionType $type,
        Account $account,
        User $author,
        string $amount,
        \DateTimeInterface $date,
        ?string $comment,
        Transfer $transfer,
        ?Category $category = null,
    ): Transaction {
        $transaction = new Transaction();
        $transaction->setType($type);
        $transaction->setAccount($account);
        $transaction->setAuthor($author);
        $transaction->setAmount($amount);
        $transaction->setDate($date);
        $transaction->setComment($comment);
        $transaction->setCategory($category);
        $transaction->setIsManualAmount(true);
        $transaction->setTransfer($transfer);

        return $transaction;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function resolveCategoryId(array $data, string $leg): mixed
    {
        $keys = $leg === 'outgoing'
            ? ['outgoingCategoryId', 'fromCategoryId']
            : ['incomingCategoryId', 'toCategoryId'];

        foreach ($keys as $key) {
            if (array_key_exists($key, $data)) {
                return $data[$key];
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function hasCategoryUpdate(array $data, string $leg): bool
    {
        $keys = $leg === 'outgoing'
            ? ['outgoingCategoryId', 'fromCategoryId']
            : ['incomingCategoryId', 'toCategoryId'];

        foreach ($keys as $key) {
            if (array_key_exists($key, $data)) {
                return true;
            }
        }

        return false;
    }

    private function resolveTransferCategory(mixed $categoryId, Account $account): ?Category
    {
        if ($categoryId === null || $categoryId === '') {
            return null;
        }

        if ($categoryId instanceof Category) {
            $category = $categoryId;
        } elseif (is_int($categoryId) && $categoryId > 0) {
            $category = $this->categoryRepository->find($categoryId);
            if ($category === null) {
                throw new \InvalidArgumentException('Category not found.');
            }
        } else {
            throw new \InvalidArgumentException('Invalid category.');
        }

        if ($category->getAccount()?->getId() !== $account->getId()) {
            throw new \InvalidArgumentException('Category does not belong to the account.');
        }

        if ($category->getType() !== self::TRANSFER_CATEGORY_TYPE) {
            throw new \InvalidArgumentException('Category must be of type transfer.');
        }

        return $category;
    }

    private function assertAuthor(Transfer $transfer, User $author): void
    {
        $transferAuthor = $transfer->getAuthor();
        if ($transferAuthor === null || $transferAuthor->getId() !== $author->getId()) {
            throw new AccessDeniedException('Only the transfer author can modify or delete this transfer.');
        }
    }

    private function resolveAccount(mixed $account): Account
    {
        if ($account instanceof Account) {
            return $account;
        }

        if (is_int($account) && $account > 0) {
            $entity = $this->accountRepository->find($account);
            if ($entity === null) {
                throw new \InvalidArgumentException('Account not found.');
            }

            return $entity;
        }

        throw new \InvalidArgumentException('Account is required.');
    }

    private function resolveDate(mixed $date): \DateTimeInterface
    {
        if ($date instanceof \DateTimeInterface) {
            return $date;
        }

        if (is_string($date) && $date !== '') {
            return new \DateTime($date);
        }

        throw new \InvalidArgumentException('Transfer date is required.');
    }

    private function assertTransferAccountsValid(Account $fromAccount, Account $toAccount): void
    {
        if ($fromAccount->getId() === $toAccount->getId()) {
            throw new \InvalidArgumentException('Transfer accounts must be different.');
        }

        if ($fromAccount->getCurrency() !== $toAccount->getCurrency()) {
            throw new \InvalidArgumentException(
                'Transfer is only allowed between accounts with the same currency.',
            );
        }
    }
}
