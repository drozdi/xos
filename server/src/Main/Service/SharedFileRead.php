<?php

namespace Main\Service;

use Board\Entity\Attachment;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Block;
use IBlock\Entity\Element;
use IBlock\Entity\ElementPropertyValue;
use IBlock\Entity\ElementShare;
use IBlock\Entity\Section;
use Main\Entity\File as MainFile;
use Main\Entity\User;

/** Lets a board member or an iblock reader open a file they did not upload. */
final class SharedFileRead
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function canRead(MainFile $file, ?User $user): bool
    {
        if (!$user instanceof User || null === $file->getId()) {
            return false;
        }

        return match ($file->getModule()) {
            'board' => $this->boardMember($file, $user),
            'iblock' => $this->iblockReader($file, $user),
            default => false,
        };
    }

    private function boardMember(MainFile $file, User $user): bool
    {
        $count = (int) $this->entityManager->createQueryBuilder()
            ->select('COUNT(a.id)')
            ->from(Attachment::class, 'a')
            ->join('a.card', 'c')
            ->join('c.list', 'l')
            ->join('l.board', 'b')
            ->join('b.workspace', 'w')
            ->leftJoin('w.members', 'wm', 'WITH', 'wm.user = :user')
            ->leftJoin('b.members', 'bm', 'WITH', 'bm.user = :user')
            ->where('a.fileId = :fileId')
            ->andWhere('w.owner = :user OR wm.id IS NOT NULL OR bm.id IS NOT NULL')
            ->setParameter('fileId', $file->getId())
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    private function iblockReader(MainFile $file, User $user): bool
    {
        if (\in_array('ROLE_IBLOCK', $user->getRoles(), true) && $this->linkedToIblock($file)) {
            return true;
        }

        $count = (int) $this->entityManager->createQueryBuilder()
            ->select('COUNT(DISTINCT e.id)')
            ->from(Element::class, 'e')
            ->leftJoin(ElementPropertyValue::class, 'epv', 'WITH', 'epv.element = e AND epv.valueFile = :file')
            ->leftJoin(ElementShare::class, 's', 'WITH', 's.element = e AND s.user = :user')
            ->where('e.previewImage = :file OR e.detailImage = :file OR epv.id IS NOT NULL')
            ->andWhere('e.createdBy = :user OR e.createdBy IS NULL OR s.id IS NOT NULL')
            ->setParameter('file', $file)
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    private function linkedToIblock(MainFile $file): bool
    {
        $checks = [
            ['e', Element::class, 'e.previewImage = :file OR e.detailImage = :file'],
            ['s', Section::class, 's.previewImage = :file OR s.detailImage = :file'],
            ['b', Block::class, 'b.previewImage = :file OR b.detailImage = :file'],
            ['v', ElementPropertyValue::class, 'v.valueFile = :file'],
        ];
        foreach ($checks as [$alias, $class, $where]) {
            $count = (int) $this->entityManager->createQueryBuilder()
                ->select('COUNT('.$alias.'.id)')
                ->from($class, $alias)
                ->where($where)
                ->setParameter('file', $file)
                ->getQuery()
                ->getSingleScalarResult();
            if ($count > 0) {
                return true;
            }
        }

        return false;
    }
}
