import { Button, Flex, Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
	useItemDelete,
	useItemsQuery,
} from '@inccom/entities/item';
import type { IItem } from '@inccom/entities/item/model/types';
import {
	ITEM_CATEGORIES_ALL_PARAMS,
	useItemCategoriesQuery,
} from '@inccom/entities/item-category';
import {
	buildCategoriesById,
	buildCategoryLabel,
} from '@inccom/entities/item-category/lib/category-options';
import { ItemCategoryFilterSelect } from '@inccom/features/item-filter';
import { Template } from '@inccom/layouts';
import { DataTable, type DataTableColumn } from '@/ui/data-table';

function formatEmptyValue(value: string | null | undefined): string {
	return value?.trim() ? value : '—';
}

export function ItemsListPage() {
	const navigate = useNavigate();
	const [categoryId, setCategoryId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const queryParams = useMemo(
		() => ({
			limit: 100,
			offset: 0,
			...(categoryId !== null ? { category: categoryId } : {}),
			...(search.trim() ? { search: search.trim() } : {}),
		}),
		[categoryId, search],
	);
	const { data, isLoading } = useItemsQuery(queryParams);
	const { data: categoriesData } = useItemCategoriesQuery(ITEM_CATEGORIES_ALL_PARAMS);
	const deleteMutation = useItemDelete();
	const items = data?.items ?? [];

	const categoryLabelsById = useMemo(() => {
		const categories = categoriesData?.items ?? [];
		const categoriesById = buildCategoriesById(categories);
		const labels = new Map<number, string>();

		for (const category of categories) {
			labels.set(category.id, buildCategoryLabel(category, categoriesById));
		}

		return labels;
	}, [categoriesData?.items]);

	const formatItemCategories = useCallback(
		(categoryIds: number[]) => {
			if (!categoryIds.length) {
				return '—';
			}

			return categoryIds
				.map((id) => categoryLabelsById.get(id))
				.filter(Boolean)
				.join(', ');
		},
		[categoryLabelsById],
	);

	const hasFilters = categoryId !== null || search.trim().length > 0;
	const emptyText = hasFilters ? 'Товары не найдены' : 'Товаров нет';

	const columns = useMemo<DataTableColumn<IItem>[]>(
		() => [
			{
				field: 'name',
				header: 'Название',
				sortable: true,
				resizable: true,
				render: (item) => <Link to={`/items/${item.id}`}>{item.name}</Link>,
			},
			{
				field: 'categoryIds',
				header: 'Категории',
				sortable: false,
				resizable: true,
				render: (item) => formatItemCategories(item.categoryIds),
			},
			{
				field: 'unit',
				header: 'Ед. изм.',
				sortable: true,
				resizable: true,
				render: (item) => formatEmptyValue(item.unit),
			},
			{
				field: 'description',
				header: 'Описание',
				sortable: true,
				resizable: true,
				render: (item) => formatEmptyValue(item.description),
			},
		],
		[formatItemCategories],
	);

	return (
		<>
			<Template.Title>Товары</Template.Title>
			<Flex vertical gap={16}>
				<Flex justify="space-between" align="flex-end" wrap="wrap" gap={12}>
					<Flex align="flex-end" wrap="wrap" gap={12}>
						<div style={{ minWidth: 240 }}>
							<div style={{ marginBottom: 4 }}>Название</div>
							<Input
								placeholder="Введите название товара"
								allowClear
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<ItemCategoryFilterSelect
							value={categoryId}
							onChange={setCategoryId}
						/>
					</Flex>
					<Link to="/items/new">
						<Button type="primary">Создать товар</Button>
					</Link>
				</Flex>
				<DataTable<IItem>
					columns={columns}
					data={items}
					loading={isLoading}
					storageKey="items.list"
					withPagination={false}
					noDataText={emptyText}
					onEdit={(item) => navigate(`/items/${item.id}`)}
					onDelete={async (item) => {
						await deleteMutation.mutateAsync(item.id);
					}}
					getRowLabel={(item) => item.name}
				/>
			</Flex>
		</>
	);
}
