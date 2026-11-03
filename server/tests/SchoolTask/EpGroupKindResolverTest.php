<?php

namespace App\Tests\SchoolTask;

use PHPUnit\Framework\TestCase;
use SchoolTask\Entity\EpGroup;
use SchoolTask\Entity\EpSubject;
use SchoolTask\Service\EpGroupKindResolver;

class EpGroupKindResolverTest extends TestCase
{
    private EpGroupKindResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new EpGroupKindResolver();
    }

    public function testClassifiesGroupKinds(): void
    {
        $parallel = new EpGroup();
        $class = new EpGroup();
        $class->setParent($parallel);

        $subject = new EpSubject();
        $parallelSubject = new EpGroup();
        $parallelSubject->setParent($parallel);
        $parallelSubject->setSubject($subject);

        $classSubject = new EpGroup();
        $classSubject->setParent($class);
        $classSubject->setSubject($subject);

        self::assertTrue($this->resolver->isParallelGroup($parallel));
        self::assertSame('parallel', $this->resolver->getGroupKind($parallel));

        self::assertTrue($this->resolver->isClassGroup($class));
        self::assertSame('class', $this->resolver->getGroupKind($class));

        self::assertTrue($this->resolver->isParallelSubjectGroup($parallelSubject));
        self::assertSame('parallel_subject', $this->resolver->getGroupKind($parallelSubject));

        self::assertTrue($this->resolver->isClassSubjectGroup($classSubject));
        self::assertSame('class_subject', $this->resolver->getGroupKind($classSubject));
    }

    public function testClassTransitionActions(): void
    {
        $parallel = new EpGroup();
        $parallel->setGraduates(false);
        $class = new EpGroup();
        $class->setParent($parallel);

        self::assertFalse($this->resolver->shouldGraduateParallel($parallel));
        self::assertFalse($this->resolver->shouldGraduateClass($class));
        self::assertSame('promote', $this->resolver->getClassTransitionAction($class));

        $parallel->setGraduates(true);
        self::assertTrue($this->resolver->shouldGraduateParallel($parallel));
        self::assertTrue($this->resolver->shouldGraduateClass($class));
        self::assertSame('graduate', $this->resolver->getClassTransitionAction($class));

        $class->setGraduated(true);
        self::assertFalse($this->resolver->shouldGraduateClass($class));
        self::assertSame('graduated', $this->resolver->getClassTransitionAction($class));
    }
}
