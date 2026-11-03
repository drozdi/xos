<?php

namespace SchoolTask\Service;

use SchoolTask\Entity\EpGroup;
use SchoolTask\Entity\EpSubject;

/**
 * Classifies schooltask groups and class transition actions.
 */
class EpGroupKindResolver
{
    public function isParallelGroup(EpGroup $group): bool
    {
        return null === $group->getParent();
    }

    public function isClassGroup(EpGroup $group): bool
    {
        $parent = $group->getParent();

        return $parent instanceof EpGroup
            && $this->isParallelGroup($parent)
            && !$group->getSubject() instanceof EpSubject;
    }

    public function isParallelSubjectGroup(EpGroup $group): bool
    {
        $parent = $group->getParent();

        return $parent instanceof EpGroup
            && $this->isParallelGroup($parent)
            && $group->getSubject() instanceof EpSubject;
    }

    public function isClassSubjectGroup(EpGroup $group): bool
    {
        $parent = $group->getParent();

        return $parent instanceof EpGroup
            && $this->isClassGroup($parent)
            && $group->getSubject() instanceof EpSubject;
    }

    public function getGroupKind(EpGroup $group): ?string
    {
        if ($this->isParallelGroup($group)) {
            return 'parallel';
        }

        if ($this->isClassGroup($group)) {
            return 'class';
        }

        if ($this->isParallelSubjectGroup($group)) {
            return 'parallel_subject';
        }

        if ($this->isClassSubjectGroup($group)) {
            return 'class_subject';
        }

        return null;
    }

    public function shouldGraduateParallel(EpGroup $parallel): bool
    {
        return $this->isParallelGroup($parallel) && $parallel->isGraduates();
    }

    public function shouldGraduateClass(EpGroup $class): bool
    {
        if (!$this->isClassGroup($class) || $class->isGraduated()) {
            return false;
        }
        $parallel = $class->getParent();

        return $parallel instanceof EpGroup && $this->shouldGraduateParallel($parallel);
    }

    /** @return 'graduate'|'promote'|'graduated' */
    public function getClassTransitionAction(EpGroup $class): string
    {
        if ($class->isGraduated()) {
            return 'graduated';
        }

        return $this->shouldGraduateClass($class) ? 'graduate' : 'promote';
    }
}
