import {
	ITEM_CATEGORIES_ALL_PARAMS,
	useItemCategoriesQuery,
} from '@inccom/entities/item-category';
import {
	buildCategoryComboboxOptions,
	buildCategoryLabel,
	buildCategoriesById,
} from '@inccom/entities/item-category/lib/category-options';
import { Loader, Select } from '@mantine/core';
import { useMemo } from 'react';

interface ItemCategoryFilterSelectProps {
	value: number | null;
	onChange: (categoryId: number | null) => void;
}

export function ItemCategoryFilterSelect({
	value,
	onChange,
}: ItemCategoryFilterSelectProps) {
	const { data, isLoading } = useItemCategoriesQuery(ITEM_CATEGORIES_ALL_PARAMS);

	const categoryOptions = useMemo(
		() => buildCategoryComboboxOptions(data?.items ?? []),
		[data?.items],
	);

	return (
		<Select
			label="Категория"
			placeholder="Введите название категории"
			data={categoryOptions}
			value={value !== null ? String(value) : null}
			onChange={(nextValue) =>
				onChange(nextValue ? Number(nextValue) : null)
			}
			searchable
			clearable
			nothingFoundMessage="Категории не найдены"
			rightSection={isLoading ? <Loader size="xs" /> : undefined}
			w="100%"
			maw={400}
		/>
	);
}
