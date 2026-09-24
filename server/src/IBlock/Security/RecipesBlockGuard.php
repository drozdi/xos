<?php

namespace IBlock\Security;

use App\Security\RecipeIblockBridge;
use IBlock\Entity\Block;
use IBlock\Entity\Element;
use IBlock\Entity\Property;
use IBlock\Entity\Section;
use IBlock\Repository\BlockRepository;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Limits ROLE_RECIPE-only users to the seeded `recipes` block.
 */
final class RecipesBlockGuard
{
    public function __construct(
        private readonly RecipeIblockBridge $bridge,
        private readonly BlockRepository $blockRepository,
    ) {
    }

    public function isRecipeOnlyUser(?User $user): bool
    {
        return $user instanceof User && $this->bridge->isRecipeOnlyUser($user);
    }

    public function recipesBlockId(): ?int
    {
        $block = $this->blockRepository->findOneBy(['code' => RecipeIblockBridge::RECIPES_BLOCK_CODE]);

        return $block instanceof Block ? $block->getId() : null;
    }

    /**
     * @param array<string, mixed> $filter
     *
     * @return array<string, mixed>
     */
    public function constrainListFilter(array $filter, ?User $user): array
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return $filter;
        }

        $blockId = $this->recipesBlockId();
        if (null === $blockId) {
            $filter['block_id'] = -1;

            return $filter;
        }

        $requested = isset($filter['block_id']) ? (int) $filter['block_id'] : null;
        if (null !== $requested && $requested > 0 && $requested !== $blockId) {
            throw new AccessDeniedHttpException('ROLE_RECIPE ограничен блоком recipes');
        }

        $filter['block_id'] = $blockId;

        return $filter;
    }

    public function assertElementAllowed(?User $user, Element $element): void
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return;
        }
        $this->assertBlockCode($element->getBlock()?->getCode());
    }

    public function assertSectionAllowed(?User $user, Section $section): void
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return;
        }
        $this->assertBlockCode($section->getBlock()?->getCode());
    }

    public function assertPropertyAllowed(?User $user, Property $property): void
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return;
        }
        $this->assertBlockCode($property->getBlock()?->getCode());
    }

    public function assertBlockIdAllowed(?User $user, ?int $blockId): void
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return;
        }
        $allowed = $this->recipesBlockId();
        if (null === $allowed || null === $blockId || $blockId !== $allowed) {
            throw new AccessDeniedHttpException('ROLE_RECIPE ограничен блоком recipes');
        }
    }

    public function assertTypeOrBlockRead(?User $user, string $entityCode, ?string $codeFilter): void
    {
        if (!$this->isRecipeOnlyUser($user)) {
            return;
        }
        // type list: only content; block list: only recipes (or empty → forced by constrain)
        if ('type' === $entityCode && null !== $codeFilter && 'content' !== $codeFilter) {
            throw new AccessDeniedHttpException('ROLE_RECIPE: доступен только type content');
        }
        if ('block' === $entityCode && null !== $codeFilter && RecipeIblockBridge::RECIPES_BLOCK_CODE !== $codeFilter) {
            throw new AccessDeniedHttpException('ROLE_RECIPE ограничен блоком recipes');
        }
    }

    private function assertBlockCode(?string $code): void
    {
        if (RecipeIblockBridge::RECIPES_BLOCK_CODE !== $code) {
            throw new AccessDeniedHttpException('ROLE_RECIPE ограничен блоком recipes');
        }
    }
}
