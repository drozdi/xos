import {
	buildTransactionCategoriesQueryParams,
	useTransactionCategoriesQuery,
	useTransactionCategoryUpdate,
} from '@inccom/entities/transaction-category';
import { useAccountQuery } from '@inccom/entities/account';
import { useStoreUserProfile } from '@inccom/entities/user';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { Box, Group, Loader, Stack, Tooltip, type StackProps } from '@mantine/core';
import { useMemo, useState, type DragEvent } from 'react';
import { TbGripVertical } from 'react-icons/tb';
import { CategotyItem } from './item';
import classes from './category-list.module.css';

function moveCategoryInList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
	const result = [...items];
	const removed = result.splice(fromIndex, 1)[0];
	if (removed === undefined) {
		return items;
	}
	result.splice(toIndex, 0, removed);
	return result;
}

interface SortableCategoryRowProps {
	category: ICategory;
	index: number;
	canDrag: boolean;
	draggedId: number | null;
	dropTargetIndex: number | null;
	isSaving: boolean;
	onDragStart: (categoryId: number) => void;
	onDragEnd: () => void;
	onDragOver: (index: number) => void;
	onDragLeave: (index: number) => void;
	onDrop: (index: number) => void;
}

function SortableCategoryRow({
	category,
	index,
	canDrag,
	draggedId,
	dropTargetIndex,
	isSaving,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDragLeave,
	onDrop,
}: SortableCategoryRowProps) {
	const isDragging = draggedId === category.id;
	const isDropTarget = dropTargetIndex === index && draggedId !== category.id;

	function handleDragStart(event: DragEvent<HTMLDivElement>) {
		if (!canDrag || isSaving) {
			event.preventDefault();
			return;
		}
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', String(category.id));
		onDragStart(category.id);
	}

	function handleDragOver(event: DragEvent<HTMLDivElement>) {
		if (draggedId === null || draggedId === category.id) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		onDragOver(index);
	}

	function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		onDrop(index);
	}

	return (
		<Box
			className={`${classes.row} ${isDragging ? classes.rowDragging : ''} ${isDropTarget ? classes.rowDropTarget : ''}`}
			draggable={canDrag && !isSaving}
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
			onDragOver={handleDragOver}
			onDragLeave={() => onDragLeave(index)}
			onDrop={handleDrop}
		>
			<Group wrap="nowrap" gap="xs">
				{canDrag && (
					<Tooltip label="Перетащите для изменения порядка">
						<Box className={classes.dragHandle} aria-hidden>
							<TbGripVertical size={16} />
						</Box>
					</Tooltip>
				)}
				<Box style={{ flex: 1, minWidth: 0 }}>
					<CategotyItem category={category} />
				</Box>
			</Group>
		</Box>
	);
}

export function CategoryList({
	account_id,
	type,
	...props
}: StackProps & {
	account_id: ICategory['account_id'];
	type: string;
}) {
	const [draggedId, setDraggedId] = useState<number | null>(null);
	const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
	const { userData } = useStoreUserProfile();
	const { data: account } = useAccountQuery(account_id);
	const { data, isLoading } = useTransactionCategoriesQuery(
		buildTransactionCategoriesQueryParams(account_id),
		{ enabled: Boolean(account_id) && !Number.isNaN(account_id) },
	);
	const updateMutation = useTransactionCategoryUpdate();

	const categories = useMemo(
		() =>
			(data?.items ?? [])
				.filter((category) => category.type === type)
				.sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label)),
		[data?.items, type],
	);

	function canReorderCategory(category: ICategory): boolean {
		if (account?.isMaster) {
			return true;
		}
		return category.owner_id === userData?.id;
	}

	async function persistOrder(reordered: ICategory[]) {
		const updates = reordered
			.map((category, index) => ({
				id: category.id,
				account_id: category.account_id,
				sort: (index + 1) * 10,
				prevSort: category.sort,
			}))
			.filter((item) => item.sort !== item.prevSort)
			.map(({ prevSort: _prevSort, ...item }) => item);

		if (!updates.length) {
			return;
		}

		try {
			await Promise.all(
				updates.map((item) => updateMutation.mutateAsync(item)),
			);
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	async function handleDrop(toIndex: number) {
		if (draggedId === null) {
			return;
		}

		const fromIndex = categories.findIndex((category) => category.id === draggedId);
		setDraggedId(null);
		setDropTargetIndex(null);

		if (fromIndex < 0 || fromIndex === toIndex) {
			return;
		}

		const draggedCategory = categories[fromIndex];
		if (!draggedCategory || !canReorderCategory(draggedCategory)) {
			return;
		}

		const reordered = moveCategoryInList(categories, fromIndex, toIndex);
		await persistOrder(reordered);
	}

	if (isLoading) {
		return <Loader size="sm" />;
	}

	return (
		<Stack {...props}>
			{categories.map((category, index) => (
				<SortableCategoryRow
					key={category.id}
					category={category}
					index={index}
					canDrag={canReorderCategory(category)}
					draggedId={draggedId}
					dropTargetIndex={dropTargetIndex}
					isSaving={updateMutation.isPending}
					onDragStart={setDraggedId}
					onDragEnd={() => {
						setDraggedId(null);
						setDropTargetIndex(null);
					}}
					onDragOver={setDropTargetIndex}
					onDragLeave={(index) => {
						if (dropTargetIndex === index) {
							setDropTargetIndex(null);
						}
					}}
					onDrop={handleDrop}
				/>
			))}
		</Stack>
	);
}
