<?php

namespace IncCom\Service;

use AbstractManager;

use Main\Entity\User;
use Main\Repository\UserRepository;

use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Entity\Product;
use IncCom\Entity\Tag;
use IncCom\Entity\Transaction;
use IncCom\Entity\Transfer;
use IncCom\Repository\AccountRepository;
use IncCom\Repository\CategoryRepository;
use IncCom\Repository\ProductRepository;
use IncCom\Repository\TagRepository;

use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Validator\TraceableValidator;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;

use Symfony\Component\DependencyInjection\ReverseContainer;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ContainerAwareTrait;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Contracts\Service\ServiceSubscriberInterface;

use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationListInterface;


class IncComManager extends AbstractManager  {
    public function __construct(
        ValidatorInterface $Validator,
        private readonly BalanceService $balanceService,
        private readonly TransactionService $transactionService,
        private readonly TransferService $transferService,
        private readonly CategoryCopyService $categoryCopyService,
        private readonly DeletionGuardService $deletionGuardService,
    ) {
        parent::__construct($Validator);
    }

    public static function getSubscribedServices(): array
    {
        return parent::getSubscribedServices();
    }

    public function getBalanceService(): BalanceService
    {
        return $this->balanceService;
    }

    public function getTransactionService(): TransactionService
    {
        return $this->transactionService;
    }

    public function getTransferService(): TransferService
    {
        return $this->transferService;
    }

    public function getCategoryCopyService(): CategoryCopyService
    {
        return $this->categoryCopyService;
    }

    public function getDeletionGuardService(): DeletionGuardService
    {
        return $this->deletionGuardService;
    }

    public function transaction(): TransactionService
    {
        return $this->getTransactionService();
    }

    public function transfer(): TransferService
    {
        return $this->getTransferService();
    }
    public function getUserRepository (): ?UserRepository {
        return $this->getEntityManager()->getRepository(User::class);
        //return $this->container->getService(UserRepository::class);
    }
    public function getAccountRepository (): ?AccountRepository {
        return $this->getEntityManager()->getRepository(Account::class);
        //return $this->container->getService(UserRepository::class);
    }

    public function getCategoryRepository (): ?CategoryRepository {
        return $this->getEntityManager()->getRepository(Category::class);
        //return $this->container->getService(UserRepository::class);
    }

    public function getProductRepository (): ?ProductRepository {
        return $this->getEntityManager()->getRepository(Product::class);
    }

    public function getTagRepository (): ?TagRepository {
        return $this->getEntityManager()->getRepository(Tag::class);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createTransaction(array $data, User $author): Transaction
    {
        return $this->getTransactionService()->create($data, $author);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateTransaction(Transaction $transaction, array $data, User $author): Transaction
    {
        return $this->getTransactionService()->update($transaction, $data, $author);
    }

    public function deleteTransaction(Transaction $transaction, User $author): void
    {
        $this->getTransactionService()->delete($transaction, $author);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createTransfer(array $data, User $author): Transfer
    {
        return $this->getTransferService()->create($data, $author);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateTransfer(Transfer $transfer, array $data, User $author): Transfer
    {
        return $this->getTransferService()->update($transfer, $data, $author);
    }

    public function deleteTransfer(Transfer $transfer, User $author): void
    {
        $this->getTransferService()->delete($transfer, $author);
    }

    /**
     * @param int[]|null $categoryIds
     *
     * @return array{copied: Category[], skipped: array<int, array{name: string, reason: string}>}
     */
    public function copyCategories(
        int $fromAccountId,
        int $targetAccountId,
        User $user,
        ?string $type = null,
        ?array $categoryIds = null,
    ): array {
        return $this->getCategoryCopyService()->copy(
            $fromAccountId,
            $targetAccountId,
            $user,
            $type,
            $categoryIds,
        );
    }

    public function deleteAccountEntity(Account $account): void
    {
        $this->getDeletionGuardService()->assertAccountDeletable($account);
        $this->getAccountRepository()->remove($account, true);
    }

    public function deleteCategoryEntity(Category $category): void
    {
        $this->getDeletionGuardService()->assertCategoryDeletable($category);
        $this->getCategoryRepository()->remove($category, true);
    }

    public function deleteProductEntity(Product $product): void
    {
        $this->getDeletionGuardService()->assertItemDeletable($product);
        $this->getProductRepository()->remove($product, true);
    }

    public function deleteTagEntity(Tag $tag): void
    {
        $this->getDeletionGuardService()->assertItemCategoryDeletable($tag);
        $this->getTagRepository()->remove($tag, true);
    }

    /**
     * @param mixed|null $account
     * @param array|null $arAccount
     *
     * @throws ValidationFailedException
     *
     * @return Account
     */
    public function account (mixed $account = null, ?array $arAccount = null): Account {
        if (is_int($account) && $account > 0) {
            $account = $this->getAccountRepository()->find($account);
        } elseif (is_array($account)) {
            $account = $this->getAccountRepository()->findOneBy($account);
        }
        if (!($account instanceof Account)) {
            $account = new Account();
        }
        if (empty($arAccount)) {
            return $account;
        }
        if (array_key_exists('label', $arAccount)) {
            $account->setLabel($arAccount['label']);
        }
        if (array_key_exists('balance', $arAccount)) {
            $account->setBalance($arAccount['balance']);
        }
        if (array_key_exists('sort', $arAccount)) {
            $account->setSort($arAccount['sort']);
        }
        if (array_key_exists('type', $arAccount)) {
            $account->setType($arAccount['type']);
        }
        if (array_key_exists('color', $arAccount)) {
            $account->setColor($arAccount['color']);
        }
        if (array_key_exists('icon', $arAccount)) {
            $account->setIcon($arAccount['icon']);
        }
        if (array_key_exists('description', $arAccount)) {
            $account->setDescription($arAccount['description']);
        }
        if (array_key_exists('currency', $arAccount)) {
            $account->setCurrency($arAccount['currency']);
        }
        if (array_key_exists('number', $arAccount)) {
            $account->setNumber($arAccount['number']);
        }
        if (array_key_exists('owner_id', $arAccount)) {
            $account->setMaster($this->getUserRepository()->find((int)$arAccount['owner_id']));
        } elseif (array_key_exists('owner', $arAccount) && $arAccount['owner'] instanceof User) {
            $account->setMaster($arAccount['owner']);
        } elseif (array_key_exists('master_id', $arAccount)) {
            $account->setMaster($this->getUserRepository()->find((int)$arAccount['master_id']));
        } elseif (array_key_exists('master', $arAccount) && $arAccount['master'] instanceof User) {
            $account->setMaster($arAccount['master']);
        }

        $errors = $this->getValidator()->validate($account);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arAccount, $errors);
        }
        $this->getAccountRepository()->save($account, true);

        return $account;
    }

    /**
     * @param mixed|null $category
     * @param array|null $arCategory
     *
     * @throws ValidationFailedException
     *
     * @return Category
     */
    public function category (mixed $category = null, ?array $arCategory = null): Category {
        if (is_int($category) && $category > 0) {
            $category = $this->getCategoryRepository()->find($category);
        } elseif (is_array($category)) {
            $category = $this->getCategoryRepository()->findOneBy($category);
        }
        if (!($category instanceof Category)) {
            $category = new Category();
        }
        if (empty($arCategory)) {
            return $category;
        }
        if (array_key_exists('label', $arCategory)) {
            $category->setLabel($arCategory['label']);
        }
        if (array_key_exists('sort', $arCategory)) {
            $category->setSort($arCategory['sort']);
        }
        if (array_key_exists('type', $arCategory)) {
            $category->setType($arCategory['type']);
        }
        if (array_key_exists('account_id', $arCategory)) {
            $category->setAccount($this->getAccountRepository()->find((int)$arCategory['account_id']));
        } elseif (array_key_exists('account', $arCategory) && $arCategory['account'] instanceof Account) {
            $category->setAccount($arCategory['account']);
        }
        if (array_key_exists('owner_id', $arCategory)) {
            $category->setCreatedBy($this->getUserRepository()->find((int)$arCategory['owner_id']));
        } elseif (array_key_exists('created_by_id', $arCategory)) {
            $category->setCreatedBy($this->getUserRepository()->find((int)$arCategory['created_by_id']));
        } elseif (array_key_exists('owner', $arCategory) && $arCategory['owner'] instanceof User) {
            $category->setCreatedBy($arCategory['owner']);
        } elseif (array_key_exists('created_by', $arCategory) && $arCategory['created_by'] instanceof User) {
            $category->setCreatedBy($arCategory['created_by']);
        } elseif (!$category->getCreatedBy()) {
            $category->setCreatedBy($category->getAccount()->getMaster());
        }

        $errors = $this->getValidator()->validate($category);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arCategory, $errors);
        }
        $this->getCategoryRepository()->save($category, true);

        return $category;
    }
}
