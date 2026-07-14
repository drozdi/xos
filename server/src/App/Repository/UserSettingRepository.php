<?php

namespace App\Repository;

use App\Entity\UserSetting;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<UserSetting>
 */
class UserSettingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSetting::class);
    }

    /**
     * @return UserSetting[]
     */
    public function findByUser(User $user, ?string $category = null): array
    {
        $qb = $this->createQueryBuilder('s')
            ->andWhere('s.user = :user')
            ->setParameter('user', $user)
            ->orderBy('s.category', 'ASC')
            ->addOrderBy('s.key', 'ASC');

        if (null !== $category) {
            $qb
                ->andWhere('s.category = :category')
                ->setParameter('category', $category);
        }

        return $qb->getQuery()->getResult();
    }

    public function findOneByUserCategoryKey(User $user, string $category, string $key): ?UserSetting
    {
        return $this->findOneBy([
            'user' => $user,
            'category' => $category,
            'key' => $key,
        ]);
    }

    public function upsert(User $user, string $category, string $key, mixed $value): UserSetting
    {
        $setting = $this->findOneByUserCategoryKey($user, $category, $key);
        $now = new \DateTimeImmutable();

        if (null === $setting) {
            $setting = new UserSetting();
            $setting->setUser($user);
            $setting->setCategory($category);
            $setting->setKey($key);
        }

        $setting->setValue($value);
        $setting->setUpdatedAt($now);

        $this->getEntityManager()->persist($setting);

        return $setting;
    }

    public function deleteByUserCategoryKey(User $user, string $category, string $key): bool
    {
        $setting = $this->findOneByUserCategoryKey($user, $category, $key);
        if (null === $setting) {
            return false;
        }

        $this->getEntityManager()->remove($setting);

        return true;
    }
}
