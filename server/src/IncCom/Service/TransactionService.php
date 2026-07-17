<?php

namespace IncCom\Service;

use Doctrine\ORM\EntityManagerInterface;
use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Entity\Product;
use IncCom\Entity\Transaction;
use IncCom\Entity\TransactionItem;
use IncCom\Enum\TransactionType;
use IncCom\Repository\AccountRepository;
use IncCom\Repository\CategoryRepository;
use IncCom\Repository\ProductRepository;
use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * CRUD for income/expense transactions with balance updates and item amount recalculation.
 */
class TransactionService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BalanceService $balanceService,
        private readonly AccountRepository $accountRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly ProductRepository $productRepository,
    ) {
    }

    /**
     * Create an income or expense transaction.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data, User $author): Transaction
    {
        return $this->em->wrapInTransaction(function () use ($data, $author): Transaction {
            $transaction = new Transaction();
            $transaction->setAuthor($author);
            $this->populateTransaction($transaction, $data);

            $this->balanceService->applyDelta(
                $transaction->getAccount(),
                $this->computeBalanceDelta($transaction),
            );

            $this->em->persist($transaction);
            $this->em->flush();

            return $transaction;
        });
    }

    /**
     * Update a transaction (author only). Reverts old balance delta, then applies new one.
     *
     * @param array<string, mixed> $data
     */
    public function update(Transaction $transaction, array $data, User $author): Transaction
    {
        $this->assertAuthor($transaction, $author);

        return $this->em->wrapInTransaction(function () use ($transaction, $data): Transaction {
            $oldAccount = $transaction->getAccount();
            $oldDelta = $this->computeBalanceDelta($transaction);

            $this->populateTransaction($transaction, $data);

            $this->balanceService->applyDelta($oldAccount, $this->invertDelta($oldDelta));
            $this->balanceService->applyDelta(
                $transaction->getAccount(),
                $this->computeBalanceDelta($transaction),
            );

            $this->em->flush();

            return $transaction;
        });
    }

    /**
     * Delete a transaction (author only) and revert its balance effect.
     */
    public function delete(Transaction $transaction, User $author): void
    {
        $this->assertAuthor($transaction, $author);

        $this->em->wrapInTransaction(function () use ($transaction): void {
            $this->balanceService->applyDelta(
                $transaction->getAccount(),
                $this->invertDelta($this->computeBalanceDelta($transaction)),
            );

            $this->em->remove($transaction);
            $this->em->flush();
        });
    }

    /**
     * @param array<string, mixed> $data
     */
    private function populateTransaction(Transaction $transaction, array $data): void
    {
        if (array_key_exists('account', $data)) {
            $transaction->setAccount($this->resolveAccount($data['account']));
        } elseif (!$transaction->getId()) {
            throw new \InvalidArgumentException('Account is required.');
        }

        if (array_key_exists('type', $data)) {
            $transaction->setType($this->resolveType($data['type']));
        } elseif (!$transaction->getId()) {
            throw new \InvalidArgumentException('Transaction type is required.');
        }

        if (array_key_exists('date', $data)) {
            $transaction->setDate($this->resolveDate($data['date']));
        } elseif (!$transaction->getId()) {
            throw new \InvalidArgumentException('Transaction date is required.');
        }

        if (array_key_exists('comment', $data)) {
            $transaction->setComment($data['comment']);
        }

        if (array_key_exists('category', $data)) {
            $transaction->setCategory($this->resolveCategory($data['category']));
        }

        if (array_key_exists('mcc', $data)) {
            $transaction->setMcc($data['mcc']);
        }

        if (array_key_exists('fn', $data)) {
            $transaction->setFn($data['fn']);
        }

        if (array_key_exists('fpd', $data)) {
            $transaction->setFpd($data['fpd']);
        }

        if (array_key_exists('fp', $data)) {
            $transaction->setFp($data['fp']);
        }

        if (array_key_exists('fd', $data)) {
            $transaction->setFd($data['fd']);
        }

        if (array_key_exists('isManualAmount', $data)) {
            $transaction->setIsManualAmount((bool) $data['isManualAmount']);
        }

        if (array_key_exists('items', $data)) {
            $this->syncItems($transaction, $data['items']);
        }

        if ($this->shouldAutoCalculateAmount($transaction)) {
            $transaction->setAmount($this->sumItems($transaction));
        } elseif (array_key_exists('amount', $data)) {
            $transaction->setAmount((string) $data['amount']);
        } elseif (!$transaction->getId()) {
            throw new \InvalidArgumentException('Transaction amount is required.');
        }
    }

    /**
     * @param array<int, array<string, mixed>> $items
     */
    private function syncItems(Transaction $transaction, array $items): void
    {
        foreach ($transaction->getItems()->toArray() as $existing) {
            $transaction->removeItem($existing);
            $this->em->remove($existing);
        }

        foreach ($items as $itemData) {
            if (!is_array($itemData)) {
                throw new \InvalidArgumentException('Each transaction item must be an array.');
            }

            $transactionItem = new TransactionItem();
            $transactionItem->setItem($this->resolveProduct($itemData['item'] ?? null));
            $transactionItem->setQuantity((string) ($itemData['quantity'] ?? '0'));
            $transactionItem->setPrice((string) ($itemData['price'] ?? '0'));
            $transactionItem->computeSum();
            $transaction->addItem($transactionItem);
        }
    }

    private function shouldAutoCalculateAmount(Transaction $transaction): bool
    {
        return $transaction->getType() === TransactionType::Expense
            && !$transaction->isManualAmount()
            && $transaction->getItems()->count() > 0;
    }

    private function sumItems(Transaction $transaction): string
    {
        $sum = '0.00';
        foreach ($transaction->getItems() as $item) {
            $sum = bcadd($sum, $item->getSum(), 2);
        }

        return $sum;
    }

    private function computeBalanceDelta(Transaction $transaction): string
    {
        $amount = $transaction->getAmount();

        if ($transaction->getType() === TransactionType::Income) {
            return $amount;
        }

        return bcsub('0.00', $amount, 2);
    }

    private function invertDelta(string $delta): string
    {
        return bcsub('0.00', $delta, 2);
    }

    private function assertAuthor(Transaction $transaction, User $author): void
    {
        $transactionAuthor = $transaction->getAuthor();
        if ($transactionAuthor === null || $transactionAuthor->getId() !== $author->getId()) {
            throw new AccessDeniedException('Only the transaction author can modify or delete this transaction.');
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

        throw new \InvalidArgumentException('Invalid account.');
    }

    private function resolveCategory(mixed $category): ?Category
    {
        if ($category === null) {
            return null;
        }

        if ($category instanceof Category) {
            return $category;
        }

        if (is_int($category) && $category > 0) {
            $entity = $this->categoryRepository->find($category);
            if ($entity === null) {
                throw new \InvalidArgumentException('Category not found.');
            }

            return $entity;
        }

        throw new \InvalidArgumentException('Invalid category.');
    }

    private function resolveProduct(mixed $product): Product
    {
        if ($product instanceof Product) {
            return $product;
        }

        if (is_int($product) && $product > 0) {
            $entity = $this->productRepository->find($product);
            if ($entity === null) {
                throw new \InvalidArgumentException('Product not found.');
            }

            return $entity;
        }

        throw new \InvalidArgumentException('Invalid product.');
    }

    private function resolveType(mixed $type): TransactionType
    {
        if ($type instanceof TransactionType) {
            return $type;
        }

        if (is_string($type)) {
            return TransactionType::from($type);
        }

        throw new \InvalidArgumentException('Invalid transaction type.');
    }

    private function resolveDate(mixed $date): \DateTimeInterface
    {
        if ($date instanceof \DateTimeInterface) {
            return $date;
        }

        if (is_string($date) && $date !== '') {
            return new \DateTime($date);
        }

        throw new \InvalidArgumentException('Invalid transaction date.');
    }
}
