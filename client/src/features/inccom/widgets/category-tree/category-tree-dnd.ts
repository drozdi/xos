export type CategoryParentMap = Map<number, number | null>;

export function canMoveCategoryToParent(
	categoryId: number,
	newParentId: number | null,
	parentById: CategoryParentMap,
): boolean {
	if (newParentId === categoryId) {
		return false;
	}

	if (newParentId === null) {
		return true;
	}

	let current: number | null | undefined = newParentId;
	while (current !== null && current !== undefined) {
		if (current === categoryId) {
			return false;
		}
		current = parentById.get(current) ?? null;
	}

	return true;
}

export function buildCategoryParentMap(
	categories: Array<{ id: number; parentId: number | null }>,
): CategoryParentMap {
	const map: CategoryParentMap = new Map();
	for (const category of categories) {
		map.set(category.id, category.parentId);
	}
	return map;
}
