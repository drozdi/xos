import { Flex, Select, Spin, Tag, Typography } from 'antd';
import { useMemo } from 'react';

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
		<Flex vertical gap={8}>
			<div>
				<div style={{ marginBottom: 4 }}>Категории</div>
				<Select
					mode="multiple"
					style={{ width: '100%' }}
					placeholder="Введите название категории"
					options={categoryOptions}
					value={value}
					onChange={onChange}
					showSearch
					allowClear
					status={error ? 'error' : undefined}
					notFoundContent={isLoading ? <Spin size="small" /> : 'Категории не найдены'}
					suffixIcon={isLoading ? <Spin size="small" /> : undefined}
					optionFilterProp="label"
				/>
				{error ? (
					<div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{error}</div>
				) : null}
			</div>
			{suggestedCategories.length > 0 ? (
				<Flex vertical gap={4}>
					<Typography.Text type="secondary">Подходящие категории</Typography.Text>
					<Flex gap={8} wrap="wrap">
						{suggestedCategories.map((category) => (
							<Tag
								key={category.id}
								style={{ cursor: 'pointer' }}
								onClick={() => addCategory(category.id)}
							>
								{category.label}
							</Tag>
						))}
					</Flex>
				</Flex>
			) : null}
		</Flex>
	);
}
