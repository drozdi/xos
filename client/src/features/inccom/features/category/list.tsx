import { Flex, Spin, Tooltip } from 'antd';
import { useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import { TbGripVertical } from 'react-icons/tb';

import { useAccountQuery } from '@inccom/entities/account';
import {
	buildTransactionCategoriesQueryParams,
	useTransactionCategoriesQuery,
	useTransactionCategoryUpdate,
} from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';

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
		<div
			className={`${classes.row} ${isDragging ? classes.rowDragging : ''} ${isDropTarget ? classes.rowDropTarget : ''}`}
			draggable={canDrag && !isSaving}
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
			onDragOver={handleDragOver}
			onDragLeave={() => onDragLeave(index)}
			onDrop={handleDrop}
		>
			<Flex wrap="nowrap" gap={8} align="center">
				{canDrag ? (
					<Tooltip title="Перетащите для изменения порядка">
						<div className={classes.dragHandle} aria-hidden>
							<TbGripVertical size={16} />
						</div>
					</Tooltip>
				) : null}
				<div style={{ flex: 1, minWidth: 0 }}>
					<CategotyItem category={category} />
				</div>
			</Flex>
		</div>
	);
}

export function CategoryList({
	account_id,
	type,
	style,
}: {
	account_id: ICategory['account_id'];
	type: string;
	style?: CSSProperties;
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
			await Promise.all(updates.map((item) => updateMutation.mutateAsync(item)));
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
		return <Spin size="small" />;
	}

	return (
		<Flex vertical gap={8} style={style}>
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
					onDragLeave={(rowIndex) => {
						if (dropTargetIndex === rowIndex) {
							setDropTargetIndex(null);
						}
					}}
					onDrop={handleDrop}
				/>
			))}
		</Flex>
	);
}
