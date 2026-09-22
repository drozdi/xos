<?php

namespace App\Tests\IBlock;

use IBlock\Entity\Section;
use IBlock\Service\SectionElementManager;
use PHPUnit\Framework\TestCase;

class SectionElementInheritanceTest extends TestCase
{
    public function testResolveInheritedFilterChildWins(): void
    {
        $root = new Section();
        $root->setElementFilter(['PROPERTY_COLOR' => 'red', 'active' => true]);

        $child = new Section();
        $child->setParent($root);
        $child->setElementFilter(['PROPERTY_COLOR' => 'blue']);

        $manager = $this->createManager();
        $merged = $manager->resolveInheritedFilter($child);

        self::assertSame('blue', $merged['PROPERTY_COLOR']);
        self::assertTrue($merged['active']);
    }

    public function testCollectSubtreeSectionIds(): void
    {
        $root = new Section();
        $this->setEntityId($root, 1);

        $child = new Section();
        $this->setEntityId($child, 2);
        $child->setParent($root);

        $grand = new Section();
        $this->setEntityId($grand, 3);
        $grand->setParent($child);

        $manager = $this->createManager();
        $ids = $manager->collectSubtreeSectionIds($root);

        self::assertSame([1, 2, 3], $ids);
    }

    private function createManager(): SectionElementManager
    {
        return new SectionElementManager(
            $this->createMock(\Doctrine\ORM\EntityManagerInterface::class),
            $this->createMock(\IBlock\Repository\SectionElementRepository::class),
            $this->createMock(\IBlock\Repository\SectionRepository::class),
        );
    }

    private function setEntityId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setAccessible(true);
        $ref->setValue($entity, $id);
    }
}
