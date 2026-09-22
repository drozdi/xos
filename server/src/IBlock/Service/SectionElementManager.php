<?php

namespace IBlock\Service;

use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Element;
use IBlock\Entity\Section;
use IBlock\Entity\SectionElement;
use IBlock\Repository\SectionElementRepository;
use IBlock\Repository\SectionRepository;

class SectionElementManager
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly SectionElementRepository $sectionElementRepository,
        private readonly SectionRepository $sectionRepository,
    ) {
    }

    /**
     * Sync M:N binds. First id becomes primary section_id when $setPrimary is true.
     *
     * @param list<int> $sectionIds
     */
    public function setSections(Element $element, array $sectionIds, bool $setPrimary = true): void
    {
        $normalized = [];
        foreach ($sectionIds as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $normalized[$id] = $id;
            }
        }
        $wanted = array_values($normalized);

        foreach ($element->getSectionLinks()->toArray() as $link) {
            $sid = $link->getSection()?->getId();
            if (null === $sid || !\in_array($sid, $wanted, true) || 0 !== $link->getAdditionalPropertyId()) {
                if (0 === $link->getAdditionalPropertyId()) {
                    $element->removeSectionLink($link);
                    $this->entityManager->remove($link);
                }
            }
        }

        $existing = [];
        foreach ($element->getSectionLinks() as $link) {
            if (0 === $link->getAdditionalPropertyId()) {
                $sid = $link->getSection()?->getId();
                if (null !== $sid) {
                    $existing[$sid] = true;
                }
            }
        }

        foreach ($wanted as $sectionId) {
            if (isset($existing[$sectionId])) {
                continue;
            }
            $section = $this->sectionRepository->find($sectionId);
            if (!$section instanceof Section) {
                continue;
            }
            $link = new SectionElement();
            $link->setSection($section);
            $link->setAdditionalPropertyId(0);
            $element->addSectionLink($link);
        }

        if ($setPrimary) {
            if ([] === $wanted) {
                $element->setSection(null);
            } else {
                $primary = $this->sectionRepository->find($wanted[0]);
                $element->setSection($primary instanceof Section ? $primary : null);
            }
        }
    }

    /** Ensure primary section_id is present in section_element. */
    public function ensurePrimaryLink(Element $element): void
    {
        $primary = $element->getSection();
        if (!$primary instanceof Section) {
            return;
        }
        $pid = $primary->getId();
        if (null === $pid) {
            return;
        }
        foreach ($element->getSectionLinks() as $link) {
            if (0 === $link->getAdditionalPropertyId() && $link->getSection()?->getId() === $pid) {
                return;
            }
        }
        $link = new SectionElement();
        $link->setSection($primary);
        $link->setAdditionalPropertyId(0);
        $element->addSectionLink($link);
    }

    /**
     * Root→leaf merge; child key wins.
     *
     * @return array<string, mixed>
     */
    public function resolveInheritedFilter(Section $section): array
    {
        $chain = [];
        $current = $section;
        while ($current instanceof Section) {
            array_unshift($chain, $current);
            $current = $current->getParent();
        }

        $merged = [];
        foreach ($chain as $node) {
            $filter = $node->getElementFilter();
            if (!\is_array($filter) || [] === $filter) {
                continue;
            }
            foreach ($filter as $key => $value) {
                $merged[(string) $key] = $value;
            }
        }

        return $merged;
    }

    /**
     * Self + all descendants (BFS).
     *
     * @return list<int>
     */
    public function collectSubtreeSectionIds(Section $section): array
    {
        $rootId = $section->getId();
        if (null === $rootId) {
            return [];
        }

        $ids = [$rootId];
        $queue = [$section];
        while ($queue) {
            /** @var Section $node */
            $node = array_shift($queue);
            foreach ($node->getChildren() as $child) {
                $cid = $child->getId();
                if (null !== $cid) {
                    $ids[] = $cid;
                }
                $queue[] = $child;
            }
        }

        return array_values(array_unique($ids));
    }

    /** @return list<SectionElement> */
    public function findByElement(int $elementId): array
    {
        return $this->sectionElementRepository->findByElement($elementId);
    }
}
