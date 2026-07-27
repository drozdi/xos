import {
	buildItemCategoriesChildParams,
	ITEM_CATEGORIES_ALL_PARAMS,
	useItemCategoriesQuery,
	useItemCategoryCreate,
	useItemCategoryDelete,
	useItemCategoryUpdate,
} from '@inccom/entities/item-category';
import type { IItemCategory } from '@inccom/entities/item-category/model/types';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import {
	ActionIcon,
	Box,
	Group,
	Loader,
	Stack,
	TagsInput,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type DragEvent,
} from 'react';
import {
	TbCheck,
	TbGripVertical,
	TbPencil,
	TbPlus,
	TbTrash,
	TbX,
} from 'react-icons/tb';
import {
	buildCategoryParentMap,
	canMoveCategoryToParent,
	type CategoryParentMap,
} from './category-tree-dnd';
import classes from './CategoryTreeWidget.module.css';

interface CategoryFormValues {
	name: string;
	keywords: string[];
}

interface CategoryDragContextValue {
	draggedId: number | null;
	setDraggedId: (id: number | null) => void;
	dropTargetId: number | 'root' | null;
	setDropTargetId: (id: number | 'root' | null) => void;
	parentById: CategoryParentMap;
	moveCategory: (categoryId: number, newParentId: number | null) => Promise<void>;
	isMoving: boolean;
}

const CategoryDragContext = createContext<CategoryDragContextValue | null>(null);

function useCategoryDragContext() {
	const context = useContext(CategoryDragContext);
	if (!context) {
		throw new Error('CategoryDragContext is not available');
	}
	return context;
}

interface AddChildFormProps {
	parentId: number;
	onDone: () => void;
}

function AddChildForm({ parentId, onDone }: AddChildFormProps) {
	const createMutation = useItemCategoryCreate();
	const form = useForm<CategoryFormValues>({
		initialValues: { name: '', keywords: [] },
		validate: { name: isNotEmpty('Введите название') },
	});

	async function handleAdd(values: CategoryFormValues) {
		await createMutation.mutateAsync({
			name: values.name.trim(),
			parentId,
			keywords: values.keywords.map((word) => word.trim()).filter(Boolean),
		});
		form.reset();
		onDone();
	}

	return (
		<form onSubmit={form.onSubmit(handleAdd)}>
			<Stack gap="xs" pl={24}>
				<Group align="flex-end" wrap="nowrap">
					<TextInput
						label="Подкатегория"
						placeholder="Название"
						style={{ flex: 1 }}
						{...form.getInputProps('name')}
					/>
					<ActionIcon
						type="submit"
						color="green"
						loading={createMutation.isPending}
						aria-label="Сохранить"
					>
						<TbCheck />
					</ActionIcon>
					<ActionIcon onClick={onDone} aria-label="Отмена">
						<TbX />
					</ActionIcon>
				</Group>
				<TagsInput
					label="Ключевые слова"
					placeholder="Введите слово и нажмите Enter"
					{...form.getInputProps('keywords')}
				/>
			</Stack>
		</form>
	);
}

interface CategoryTreeNodeProps {
	parentId: number | 'null';
	level?: number;
}

function CategoryTreeNode({ parentId, level = 0 }: CategoryTreeNodeProps) {
	const queryParams = useMemo(
		() =>
			parentId === 'null'
				? { parent: 'null' as const, limit: 100, offset: 0 }
				: buildItemCategoriesChildParams(parentId),
		[parentId],
	);
	const { data, isLoading } = useItemCategoriesQuery(queryParams);
	const categories = data?.items ?? [];

	if (isLoading) {
		return <Loader size="sm" />;
	}

	if (!categories.length) {
		return null;
	}

	return (
		<Stack gap="xs" pl={level * 16}>
			{categories.map((category) => (
				<CategoryRow key={category.id} category={category} level={level} />
			))}
		</Stack>
	);
}

function CategoryKeywords({ keywords }: { keywords: string[] }) {
	if (!keywords.length) {
		return null;
	}

	return (
		<Text size="xs" c="dimmed">
			Ключевые слова: {keywords.join(', ')}
		</Text>
	);
}

function CategoryRow({
	category,
	level,
}: {
	category: IItemCategory;
	level: number;
}) {
	const {
		draggedId,
		setDraggedId,
		dropTargetId,
		setDropTargetId,
		parentById,
		moveCategory,
		isMoving,
	} = useCategoryDragContext();
	const [isEdit, setIsEdit] = useState(false);
	const [showAddChild, setShowAddChild] = useState(false);
	const updateMutation = useItemCategoryUpdate();
	const deleteMutation = useItemCategoryDelete();

	const form = useForm<CategoryFormValues>({
		initialValues: {
			name: category.name,
			keywords: category.keywords ?? [],
		},
		validate: { name: isNotEmpty('Введите название') },
	});

	const isDragging = draggedId === category.id;
	const isDropTarget = dropTargetId === category.id;
	const canAcceptDrop =
		draggedId !== null &&
		draggedId !== category.id &&
		canMoveCategoryToParent(draggedId, category.id, parentById);

	async function handleSave(values: CategoryFormValues) {
		await updateMutation.mutateAsync({
			id: category.id,
			name: values.name.trim(),
			keywords: values.keywords.map((word) => word.trim()).filter(Boolean),
		});
		setIsEdit(false);
	}

	async function handleDelete() {
		await deleteMutation.mutateAsync(category.id);
	}

	function startEdit() {
		form.setValues({
			name: category.name,
			keywords: category.keywords ?? [],
		});
		setIsEdit(true);
	}

	function handleDragStart(event: DragEvent<HTMLDivElement>) {
		if (isEdit || isMoving) {
			event.preventDefault();
			return;
		}
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', String(category.id));
		setDraggedId(category.id);
	}

	function handleDragEnd() {
		setDraggedId(null);
		setDropTargetId(null);
	}

	function handleDragOver(event: DragEvent<HTMLDivElement>) {
		if (!canAcceptDrop) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setDropTargetId(category.id);
	}

	function handleDragLeave() {
		if (dropTargetId === category.id) {
			setDropTargetId(null);
		}
	}

	async function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		setDropTargetId(null);
		if (draggedId === null || !canAcceptDrop) {
			return;
		}
		await moveCategory(draggedId, category.id);
		setDraggedId(null);
	}

	return (
		<Stack gap="xs">
			<Box
				className={`${classes.row} ${isDragging ? classes.rowDragging : ''} ${isDropTarget && canAcceptDrop ? classes.rowDropTarget : ''}`}
				draggable={!isEdit && !isMoving}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{isEdit ? (
					<form onSubmit={form.onSubmit(handleSave)}>
						<Stack gap="xs">
							<Group align="flex-end" wrap="nowrap">
								<TextInput
									label="Название"
									style={{ flex: 1 }}
									{...form.getInputProps('name')}
								/>
								<ActionIcon
									type="submit"
									color="green"
									loading={updateMutation.isPending}
									aria-label="Сохранить"
								>
									<TbCheck />
								</ActionIcon>
								<ActionIcon onClick={() => setIsEdit(false)} aria-label="Отмена">
									<TbX />
								</ActionIcon>
							</Group>
							<TagsInput
								label="Ключевые слова"
								placeholder="Введите слово и нажмите Enter"
								{...form.getInputProps('keywords')}
							/>
						</Stack>
					</form>
				) : (
					<Stack gap={2}>
						<Group justify="space-between" wrap="nowrap">
							<Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
								<Tooltip label="Перетащите в другую категорию">
									<Box className={classes.dragHandle} aria-hidden>
										<TbGripVertical size={16} />
									</Box>
								</Tooltip>
								<Text fw={level === 0 ? 600 : 400} truncate>
									{category.name}
								</Text>
							</Group>
							<Group gap={4} wrap="nowrap">
								<Tooltip label="Редактировать">
									<ActionIcon
										variant="subtle"
										onClick={startEdit}
										aria-label="Редактировать"
									>
										<TbPencil />
									</ActionIcon>
								</Tooltip>
								<Tooltip label="Добавить подкатегорию">
									<ActionIcon
										variant="subtle"
										onClick={() => setShowAddChild((value) => !value)}
										aria-label="Добавить подкатегорию"
									>
										<TbPlus />
									</ActionIcon>
								</Tooltip>
								<Tooltip label="Удалить">
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={handleDelete}
										loading={deleteMutation.isPending}
										aria-label="Удалить"
									>
										<TbTrash />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Group>
						<CategoryKeywords keywords={category.keywords ?? []} />
					</Stack>
				)}
			</Box>
			{showAddChild && (
				<AddChildForm
					parentId={category.id}
					onDone={() => setShowAddChild(false)}
				/>
			)}
			{category.childrenCount > 0 && (
				<CategoryTreeNode parentId={category.id} level={level + 1} />
			)}
		</Stack>
	);
}

function RootDropZone() {
	const {
		draggedId,
		setDraggedId,
		dropTargetId,
		setDropTargetId,
		parentById,
		moveCategory,
	} = useCategoryDragContext();

	if (draggedId === null) {
		return null;
	}

	const currentParent = parentById.get(draggedId) ?? null;
	const canAcceptDrop =
		currentParent !== null &&
		canMoveCategoryToParent(draggedId, null, parentById);
	const isActive = dropTargetId === 'root' && canAcceptDrop;

	function handleDragOver(event: DragEvent<HTMLDivElement>) {
		if (!canAcceptDrop) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setDropTargetId('root');
	}

	function handleDragLeave() {
		if (dropTargetId === 'root') {
			setDropTargetId(null);
		}
	}

	async function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		setDropTargetId(null);
		if (draggedId === null || !canAcceptDrop) {
			return;
		}
		await moveCategory(draggedId, null);
		setDraggedId(null);
	}

	return (
		<Box
			className={`${classes.rootDropZone} ${isActive ? classes.rootDropZoneActive : ''}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			Переместить в корень
		</Box>
	);
}

export function CategoryTreeWidget() {
	const [draggedId, setDraggedId] = useState<number | null>(null);
	const [dropTargetId, setDropTargetId] = useState<number | 'root' | null>(
		null,
	);
	const { data: allCategoriesData } = useItemCategoriesQuery(
		ITEM_CATEGORIES_ALL_PARAMS,
	);
	const updateMutation = useItemCategoryUpdate();

	const parentById = useMemo(
		() => buildCategoryParentMap(allCategoriesData?.items ?? []),
		[allCategoriesData?.items],
	);

	const moveCategory = useCallback(
		async (categoryId: number, newParentId: number | null) => {
			const currentParent = parentById.get(categoryId) ?? null;
			if (currentParent === newParentId) {
				return;
			}

			if (!canMoveCategoryToParent(categoryId, newParentId, parentById)) {
				notification.error(
					'Ошибка',
					'Нельзя переместить категорию в саму себя или в подкатегорию',
				);
				return;
			}

			try {
				await updateMutation.mutateAsync({
					id: categoryId,
					parentId: newParentId,
				});
				notification.success('Категория перемещена');
			} catch (error) {
				notification.error('Ошибка', getErrorMessage(error));
			}
		},
		[parentById, updateMutation],
	);

	const contextValue = useMemo<CategoryDragContextValue>(
		() => ({
			draggedId,
			setDraggedId,
			dropTargetId,
			setDropTargetId,
			parentById,
			moveCategory,
			isMoving: updateMutation.isPending,
		}),
		[
			draggedId,
			dropTargetId,
			parentById,
			moveCategory,
			updateMutation.isPending,
		],
	);

	return (
		<CategoryDragContext.Provider value={contextValue}>
			<Stack gap="md">
				<RootDropZone />
				<CategoryTreeNode parentId="null" />
			</Stack>
		</CategoryDragContext.Provider>
	);
}
