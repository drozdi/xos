<?php

namespace IncCom\Service;

use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\OptimisticLockException;
use IncCom\Entity\Account;
use IncCom\Entity\Transaction;
use IncCom\Enum\TransactionType;

/**
 * Atomic account balance updates with pessimistic write lock and optimistic version retry.
 */
class BalanceService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Apply a delta to account balance (delta may be negative).
     */
    public function applyDelta(Account $account, string $delta): void
    {
        $account = $this->resolveManagedAccount($account);
        $currentBalance = $account->getBalance() ?? '0.00';
        $newBalance = bcadd($currentBalance, $delta, 2);
        $this->lockAndSetBalance($account, $newBalance, true);
    }

    /**
     * Full balance recalculation from transactions (repair utility).
     */
    public function recalculate(Account $account): string
    {
        $account = $this->resolveManagedAccount($account);
        $balance = $this->computeBalanceFromTransactions($account);
        $this->lockAndSetBalance($account, $balance, true);

        return $balance;
    }

    private function computeBalanceFromTransactions(Account $account): string
    {
        $income = $this->sumByType($account, TransactionType::Income);
        $expense = $this->sumByType($account, TransactionType::Expense);

        return bcsub($income, $expense, 2);
    }

    private function sumByType(Account $account, TransactionType $type): string
    {
        $result = $this->em->createQueryBuilder()
            ->select('COALESCE(SUM(t.amount), 0)')
            ->from(Transaction::class, 't')
            ->where('t.account = :account')
            ->andWhere('t.type = :type')
            ->setParameter('account', $account)
            ->setParameter('type', $type)
            ->getQuery()
            ->getSingleScalarResult();

        return (string) $result;
    }

    private function lockAndSetBalance(Account $account, string $newBalance, bool $allowRetry): void
    {
        $accountId = $account->getId();
        if ($accountId === null) {
            throw new \InvalidArgumentException('Account must be persisted before updating balance.');
        }

        $this->em->lock($account, LockMode::PESSIMISTIC_WRITE);
        $account->setBalance($newBalance);

        try {
            $this->em->flush();
        } catch (OptimisticLockException $e) {
            if (!$allowRetry) {
                throw $e;
            }

            $this->em->detach($account);
            $freshAccount = $this->em->find(Account::class, $accountId);
            if ($freshAccount === null) {
                throw $e;
            }

            $this->lockAndSetBalance($freshAccount, $newBalance, false);
        }
    }

    private function resolveManagedAccount(Account $account): Account
    {
        $accountId = $account->getId();
        if ($accountId === null) {
            throw new \InvalidArgumentException('Account must be persisted before updating balance.');
        }

        if (!$this->em->contains($account)) {
            $managed = $this->em->find(Account::class, $accountId);
            if ($managed === null) {
                throw new \InvalidArgumentException('Account not found.');
            }

            return $managed;
        }

        return $account;
    }
}
