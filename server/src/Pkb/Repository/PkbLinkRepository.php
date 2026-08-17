<?php



namespace Pkb\Repository;



use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;

use Doctrine\Persistence\ManagerRegistry;

use Pkb\Entity\PkbLink;

use Pkb\Entity\Vault;



/**

 * @extends ServiceEntityRepository<PkbLink>

 */

class PkbLinkRepository extends ServiceEntityRepository

{

    public function __construct(ManagerRegistry $registry)

    {

        parent::__construct($registry, PkbLink::class);

    }



    public function deleteByVaultAndSourcePath(Vault $vault, string $sourcePath): int

    {

        return $this->createQueryBuilder('l')

            ->delete()

            ->andWhere('l.vault = :vault')

            ->andWhere('l.sourcePath = :sourcePath')

            ->setParameter('vault', $vault)

            ->setParameter('sourcePath', $sourcePath)

            ->getQuery()

            ->execute();

    }



    public function countInboundForTargetPath(Vault $vault, string $targetPath): int

    {

        return (int) $this->createQueryBuilder('l')

            ->select('COUNT(l.id)')

            ->andWhere('l.vault = :vault')

            ->andWhere('l.targetPath = :targetPath')

            ->setParameter('vault', $vault)

            ->setParameter('targetPath', $targetPath)

            ->getQuery()

            ->getSingleScalarResult();

    }



    public function countOutboundForSourcePath(Vault $vault, string $sourcePath): int

    {

        return (int) $this->createQueryBuilder('l')

            ->select('COUNT(l.id)')

            ->andWhere('l.vault = :vault')

            ->andWhere('l.sourcePath = :sourcePath')

            ->setParameter('vault', $vault)

            ->setParameter('sourcePath', $sourcePath)

            ->getQuery()

            ->getSingleScalarResult();

    }



    /**

     * @return list<PkbLink>

     */

    public function findBacklinks(Vault $vault, string $path, string $title, bool $caseSensitive = false): array

    {

        $qb = $this->createQueryBuilder('l')

            ->andWhere('l.vault = :vault')

            ->setParameter('vault', $vault);



        if ($caseSensitive) {

            $qb->andWhere('l.targetPath = :path OR l.targetKey = :title')

                ->setParameter('path', $path)

                ->setParameter('title', $title);

        } else {

            $qb->andWhere('l.targetPath = :path OR LOWER(l.targetKey) = LOWER(:title)')

                ->setParameter('path', $path)

                ->setParameter('title', $title);

        }



        return $qb->orderBy('l.sourcePath', 'ASC')

            ->getQuery()

            ->getResult();

    }



    /** @return list<PkbLink> */

    public function findGraphLinks(Vault $vault): array

    {

        return $this->createQueryBuilder('l')

            ->andWhere('l.vault = :vault')

            ->andWhere('l.linkType != :tagType')

            ->setParameter('vault', $vault)

            ->setParameter('tagType', PkbLink::TYPE_TAG)

            ->orderBy('l.sourcePath', 'ASC')

            ->getQuery()

            ->getResult();

    }



    public function deleteByVaultAndPath(Vault $vault, string $path): int

    {

        return (int) $this->createQueryBuilder('l')

            ->delete()

            ->andWhere('l.vault = :vault')

            ->andWhere('l.sourcePath = :path OR l.targetPath = :path')

            ->setParameter('vault', $vault)

            ->setParameter('path', $path)

            ->getQuery()

            ->execute();

    }

}

