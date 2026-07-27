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
import { DataColumn, TableData, TableSearch } from '@inccom/shared/ui/table';
import { Anchor, Button, Group, Stack } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { TbPencil, TbTrash } from 'react-icons/tb';
import { Link, useNavigate } from 'react-router-dom';

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

	const handleDelete = useCallback(
		async (id: number) => {
			await deleteMutation.mutateAsync(id);
		},
		[deleteMutation],
	);

	const rowActions = useMemo(
		() => [
			{
				id: 'edit',
				label: 'Редактировать',
				icon: <TbPencil size={16} />,
				onClick: (item: IItem) => navigate(`/items/${item.id}`),
			},
			{
				id: 'delete',
				label: 'Удалить',
				icon: <TbTrash size={16} />,
				color: 'red',
				onClick: (item: IItem) => {
					void handleDelete(item.id);
				},
			},
		],
		[handleDelete, navigate],
	);

	const hasFilters = categoryId !== null || search.trim().length > 0;
	const emptyText = hasFilters ? 'Товары не найдены' : 'Товаров нет';

	return (
		<>
			<Template.Title>Товары</Template.Title>
			<Stack gap="md">
				<Group justify="space-between" align="flex-end" wrap="wrap">
					<Group align="flex-end" wrap="wrap">
						<TableSearch
							label="Название"
							placeholder="Введите название товара"
							onChange={setSearch}
							maw={320}
							w="100%"
						/>
						<ItemCategoryFilterSelect
							value={categoryId}
							onChange={setCategoryId}
						/>
					</Group>
					<Button component={Link} to="/items/new">
						Создать товар
					</Button>
				</Group>
				<TableData<IItem>
					data={items}
					loading={isLoading}
					rowActions={rowActions}
					rowActionsOnHover={false}
					withPagination={false}
					withTableBorder
					storage="items.list"
					noDataText={emptyText}
					w="100%"
				>
					<DataColumn<IItem>
						field="name"
						header="Название"
						sortable
						resizable
						body={(item) => (
							<Anchor component={Link} to={`/items/${item.id}`}>
								{item.name}
							</Anchor>
						)}
					/>
					<DataColumn<IItem>
						field="categoryIds"
						header="Категории"
						sortable={false}
						resizable
						body={(item) => formatItemCategories(item.categoryIds)}
					/>
					<DataColumn<IItem>
						field="unit"
						header="Ед. изм."
						sortable
						resizable
						body={(item) => formatEmptyValue(item.unit)}
					/>
					<DataColumn<IItem>
						field="description"
						header="Описание"
						sortable
						resizable
						ellipsis
						body={(item) => formatEmptyValue(item.description)}
					/>
					<DataColumn<IItem & { _actions?: unknown }>
						field="_actions"
						actions
						actionsAt="end"
						header=""
						width={88}
					/>
				</TableData>
			</Stack>
		</>
	);
}
