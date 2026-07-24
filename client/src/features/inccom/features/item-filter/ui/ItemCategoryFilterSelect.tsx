import { Select, Spin } from 'antd';
import { useMemo } from 'react';

import {
	ITEM_CATEGORIES_ALL_PARAMS,
	useItemCategoriesQuery,
} from '@inccom/entities/item-category';
import { buildCategoryComboboxOptions } from '@inccom/entities/item-category/lib/category-options';

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
		<div style={{ width: '100%', maxWidth: 400 }}>
			<div style={{ marginBottom: 4 }}>Категория</div>
			<Select
				style={{ width: '100%' }}
				placeholder="Введите название категории"
				options={categoryOptions}
				value={value !== null ? String(value) : undefined}
				onChange={(nextValue) => onChange(nextValue ? Number(nextValue) : null)}
				showSearch
				allowClear
				notFoundContent={isLoading ? <Spin size="small" /> : 'Категории не найдены'}
				suffixIcon={isLoading ? <Spin size="small" /> : undefined}
				optionFilterProp="label"
			/>
		</div>
	);
}
