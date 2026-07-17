<?php

namespace IncCom\Service;

use Doctrine\ORM\EntityManagerInterface;
use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Repository\AccountRepository;
use IncCom\Repository\CategoryRepository;
use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Copies transaction categories between accounts with duplicate detection.
 */
class CategoryCopyService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly AccountAccessService $accountAccessService,
        private readonly AccountRepository $accountRepository,
        private readonly CategoryRepository $categoryRepository,
    ) {
    }

    /**
     * @param int[]|null $categoryIds
     *
     * @return array{copied: Category[], skipped: array<int, array{name: string, reason: string}>}
     */
    public function copy(
        int $fromAccountId,
        int $targetAccountId,
        User $user,
        ?string $type = null,
        ?array $categoryIds = null,
    ): array {
        $fromAccount = $this->resolveAccount($fromAccountId);
        $targetAccount = $this->resolveAccount($targetAccountId);

        $this->assertAccess($fromAccount, $user);
        $this->assertAccess($targetAccount, $user);

        $sourceCategories = $this->resolveSourceCategories($fromAccount, $type, $categoryIds);
        $existingLabels = $this->loadExistingLabels($targetAccount);

        $copied = [];
        $skipped = [];

        foreach ($sourceCategories as $source) {
            $label = $source->getLabel();
            $labelKey = $this->labelKey($label, $source->getType());

            if (isset($existingLabels[$labelKey])) {
                $skipped[] = [
                    'name' => $label,
                    'reason' => 'duplicate',
                ];
                continue;
            }

            $copy = new Category();
            $copy->setAccount($targetAccount);
            $copy->setLabel($label);
            $copy->setType($source->getType());
            $copy->setSort($source->getSort() ?? 100);
            $copy->setCreatedBy($user);

            $this->em->persist($copy);
            $copied[] = $copy;
            $existingLabels[$labelKey] = true;
        }

        if ($copied !== []) {
            $this->em->flush();
        }

        return [
            'copied' => $copied,
            'skipped' => $skipped,
        ];
    }

    private function assertAccess(Account $account, User $user): void
    {
        if (!$this->accountAccessService->canAccess($account, $user)) {
            throw new AccessDeniedException('You do not have access to this account.');
        }
    }

    private function resolveAccount(int $accountId): Account
    {
        $account = $this->accountRepository->find($accountId);
        if ($account === null) {
            throw new \InvalidArgumentException('Account not found.');
        }

        return $account;
    }

    /**
     * @param int[]|null $categoryIds
     *
     * @return Category[]
     */
    private function resolveSourceCategories(Account $fromAccount, ?string $type, ?array $categoryIds): array
    {
        $criteria = ['account' => $fromAccount];
        if ($type !== null && $type !== '') {
            $criteria['type'] = $type;
        }

        if ($categoryIds !== null && $categoryIds !== []) {
            $categories = [];
            foreach ($categoryIds as $categoryId) {
                if (!is_int($categoryId) || $categoryId <= 0) {
                    throw new \InvalidArgumentException('Invalid category id.');
                }

                $category = $this->categoryRepository->find($categoryId);
                if ($category === null) {
                    throw new \InvalidArgumentException('Category not found.');
                }

                if ($category->getAccount()?->getId() !== $fromAccount->getId()) {
                    throw new \InvalidArgumentException('Category does not belong to the source account.');
                }

                if ($type !== null && $type !== '' && $category->getType() !== $type) {
                    continue;
                }

                $categories[] = $category;
            }

            return $categories;
        }

        return $this->categoryRepository->findBy($criteria, ['sort' => 'ASC']);
    }

    /**
     * @return array<string, true>
     */
    private function loadExistingLabels(Account $targetAccount): array
    {
        $existing = [];
        foreach ($this->categoryRepository->findBy(['account' => $targetAccount]) as $category) {
            $existing[$this->labelKey($category->getLabel(), $category->getType())] = true;
        }

        return $existing;
    }

    private function labelKey(string $label, ?string $type): string
    {
        return mb_strtolower(trim($label)) . '|' . ($type ?? '');
    }
}
