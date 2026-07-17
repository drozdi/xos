import type { IItemCategory } from '../model/types';

export function buildCategoryLabel(
	category: IItemCategory,
	categoriesById: Map<number, IItemCategory>,
): string {
	const parts: string[] = [category.name];
	let parentId = category.parentId;

	while (parentId !== null) {
		const parent = categoriesById.get(parentId);
		if (!parent) {
			break;
		}
		parts.unshift(parent.name);
		parentId = parent.parentId;
	}

	return parts.join(' / ');
}

export function buildCategoriesById(
	categories: IItemCategory[],
): Map<number, IItemCategory> {
	return new Map(categories.map((category) => [category.id, category]));
}

export function buildCategoryComboboxOptions(categories: IItemCategory[]) {
	const categoriesById = buildCategoriesById(categories);

	return categories
		.map((category) => ({
			value: String(category.id),
			label: buildCategoryLabel(category, categoriesById),
		}))
		.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

export function suggestCategoriesForItem(
	itemName: string,
	categories: IItemCategory[],
	selectedIds: Iterable<string>,
): IItemCategory[] {
	const query = itemName.trim().toLowerCase();
	if (query.length < 2) {
		return [];
	}

	const selected = new Set(selectedIds);
	const tokens = query.split(/\s+/).filter((token) => token.length >= 2);

	function matchesCategory(category: IItemCategory): boolean {
		const name = category.name.toLowerCase();
		const keywords = category.keywords.map((keyword) => keyword.toLowerCase());

		if (name.includes(query)) {
			return true;
		}

		if (keywords.some((keyword) => keyword.includes(query) || query.includes(keyword))) {
			return true;
		}

		return tokens.some(
			(token) =>
				name.includes(token) ||
				keywords.some(
					(keyword) => keyword.includes(token) || token.includes(keyword),
				),
		);
	}

	return categories
		.filter((category) => !selected.has(String(category.id)) && matchesCategory(category))
		.slice(0, 6);
}
