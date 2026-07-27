import {
	ITEM_CATEGORIES_ALL_PARAMS,
	useItemCategoriesQuery,
} from '@inccom/entities/item-category';
import {
	buildCategoriesById,
	buildCategoryComboboxOptions,
	buildCategoryLabel,
	suggestCategoriesForItem,
} from '@inccom/entities/item-category/lib/category-options';
import { Group, Loader, MultiSelect, Pill, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';

interface ItemCategoryMultiSelectProps {
	value: string[];
	onChange: (value: string[]) => void;
	itemName?: string;
	error?: string;
}

export function ItemCategoryMultiSelect({
	value,
	onChange,
	itemName = '',
	error,
}: ItemCategoryMultiSelectProps) {
	const { data, isLoading } = useItemCategoriesQuery(ITEM_CATEGORIES_ALL_PARAMS);
	const categories = data?.items ?? [];

	const categoryOptions = useMemo(
		() => buildCategoryComboboxOptions(categories),
		[categories],
	);

	const suggestedCategories = useMemo(() => {
		const categoriesById = buildCategoriesById(categories);
		return suggestCategoriesForItem(itemName, categories, value).map((category) => ({
			id: category.id,
			label: buildCategoryLabel(category, categoriesById),
		}));
	}, [categories, itemName, value]);

	function addCategory(categoryId: number) {
		const id = String(categoryId);
		if (!value.includes(id)) {
			onChange([...value, id]);
		}
	}

	return (
		<Stack gap="xs">
			<MultiSelect
				label="Категории"
				placeholder="Введите название категории"
				data={categoryOptions}
				value={value}
				onChange={onChange}
				searchable
				clearable
				nothingFoundMessage="Категории не найдены"
				rightSection={isLoading ? <Loader size="xs" /> : undefined}
				error={error}
			/>
			{suggestedCategories.length > 0 && (
				<Stack gap={4}>
					<Text size="sm" c="dimmed">
						Подходящие категории
					</Text>
					<Group gap="xs">
						{suggestedCategories.map((category) => (
							<Pill
								key={category.id}
								withRemoveButton={false}
								style={{ cursor: 'pointer' }}
								onClick={() => addCategory(category.id)}
							>
								{category.label}
							</Pill>
						))}
					</Group>
				</Stack>
			)}
		</Stack>
	);
}
