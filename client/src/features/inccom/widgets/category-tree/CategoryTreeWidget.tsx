import { Button, Flex, Form, Input, Select, Spin, Tooltip, Typography } from 'antd';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type DragEvent,
} from 'react';
import {
	CheckOutlined,
	CloseOutlined,
	DeleteOutlined,
	EditOutlined,
	HolderOutlined,
	PlusOutlined,
} from '@ant-design/icons';

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
	const [form] = Form.useForm<CategoryFormValues>();

	async function handleAdd(values: CategoryFormValues) {
		await createMutation.mutateAsync({
			name: values.name.trim(),
			parentId,
			keywords: (values.keywords ?? []).map((word) => word.trim()).filter(Boolean),
		});
		form.resetFields();
		onDone();
	}

	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={(v) => void handleAdd(v)}
			initialValues={{ name: '', keywords: [] }}
			style={{ paddingLeft: 24 }}
		>
			<Flex align="flex-end" gap={8} wrap="nowrap">
				<Form.Item
					label="Подкатегория"
					name="name"
					rules={[{ required: true, message: 'Введите название' }]}
					style={{ flex: 1, marginBottom: 0 }}
				>
					<Input placeholder="Название" />
				</Form.Item>
				<Button
					type="primary"
					htmlType="submit"
					loading={createMutation.isPending}
					icon={<CheckOutlined />}
					aria-label="Сохранить"
				/>
				<Button onClick={onDone} icon={<CloseOutlined />} aria-label="Отмена" />
			</Flex>
			<Form.Item label="Ключевые слова" name="keywords" style={{ marginTop: 8 }}>
				<Select mode="tags" placeholder="Введите слово и нажмите Enter" tokenSeparators={[',']} />
			</Form.Item>
		</Form>
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
		return <Spin size="small" />;
	}

	if (!categories.length) {
		return null;
	}

	return (
		<Flex vertical gap={8} style={{ paddingLeft: level * 16 }}>
			{categories.map((category) => (
				<CategoryRow key={category.id} category={category} level={level} />
			))}
		</Flex>
	);
}

function CategoryKeywords({ keywords }: { keywords: string[] }) {
	if (!keywords.length) {
		return null;
	}

	return (
		<Typography.Text type="secondary" style={{ fontSize: 12 }}>
			Ключевые слова: {keywords.join(', ')}
		</Typography.Text>
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
	const [form] = Form.useForm<CategoryFormValues>();

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
			keywords: (values.keywords ?? []).map((word) => word.trim()).filter(Boolean),
		});
		setIsEdit(false);
	}

	async function handleDelete() {
		await deleteMutation.mutateAsync(category.id);
	}

	function startEdit() {
		form.setFieldsValue({
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
		<Flex vertical gap={8}>
			<div
				className={`${classes.row} ${isDragging ? classes.rowDragging : ''} ${isDropTarget && canAcceptDrop ? classes.rowDropTarget : ''}`}
				draggable={!isEdit && !isMoving}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={(e) => void handleDrop(e)}
			>
				{isEdit ? (
					<Form
						form={form}
						layout="vertical"
						onFinish={(v) => void handleSave(v)}
						initialValues={{
							name: category.name,
							keywords: category.keywords ?? [],
						}}
					>
						<Flex align="flex-end" gap={8} wrap="nowrap">
							<Form.Item
								label="Название"
								name="name"
								rules={[{ required: true, message: 'Введите название' }]}
								style={{ flex: 1, marginBottom: 0 }}
							>
								<Input />
							</Form.Item>
							<Button
								type="primary"
								htmlType="submit"
								loading={updateMutation.isPending}
								icon={<CheckOutlined />}
								aria-label="Сохранить"
							/>
							<Button onClick={() => setIsEdit(false)} icon={<CloseOutlined />} aria-label="Отмена" />
						</Flex>
						<Form.Item label="Ключевые слова" name="keywords" style={{ marginTop: 8 }}>
							<Select
								mode="tags"
								placeholder="Введите слово и нажмите Enter"
								tokenSeparators={[',']}
							/>
						</Form.Item>
					</Form>
				) : (
					<Flex vertical gap={2}>
						<Flex justify="space-between" wrap="nowrap" align="center">
							<Flex gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }} align="center">
								<Tooltip title="Перетащите в другую категорию">
									<div className={classes.dragHandle} aria-hidden>
										<HolderOutlined style={{ fontSize: 16 }} />
									</div>
								</Tooltip>
								<Typography.Text
									strong={level === 0}
									ellipsis
									style={{ flex: 1 }}
								>
									{category.name}
								</Typography.Text>
							</Flex>
							<Flex gap={4} wrap="nowrap">
								<Tooltip title="Редактировать">
									<Button
										type="text"
										onClick={startEdit}
										icon={<EditOutlined />}
										aria-label="Редактировать"
									/>
								</Tooltip>
								<Tooltip title="Добавить подкатегорию">
									<Button
										type="text"
										onClick={() => setShowAddChild((value) => !value)}
										icon={<PlusOutlined />}
										aria-label="Добавить подкатегорию"
									/>
								</Tooltip>
								<Tooltip title="Удалить">
									<Button
										type="text"
										danger
										onClick={() => void handleDelete()}
										loading={deleteMutation.isPending}
										icon={<DeleteOutlined />}
										aria-label="Удалить"
									/>
								</Tooltip>
							</Flex>
						</Flex>
						<CategoryKeywords keywords={category.keywords ?? []} />
					</Flex>
				)}
			</div>
			{showAddChild ? (
				<AddChildForm parentId={category.id} onDone={() => setShowAddChild(false)} />
			) : null}
			{category.childrenCount > 0 ? (
				<CategoryTreeNode parentId={category.id} level={level + 1} />
			) : null}
		</Flex>
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
		currentParent !== null && canMoveCategoryToParent(draggedId, null, parentById);
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
		<div
			className={`${classes.rootDropZone} ${isActive ? classes.rootDropZoneActive : ''}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={(e) => void handleDrop(e)}
		>
			Переместить в корень
		</div>
	);
}

export function CategoryTreeWidget() {
	const [draggedId, setDraggedId] = useState<number | null>(null);
	const [dropTargetId, setDropTargetId] = useState<number | 'root' | null>(null);
	const { data: allCategoriesData } = useItemCategoriesQuery(ITEM_CATEGORIES_ALL_PARAMS);
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
		[draggedId, dropTargetId, parentById, moveCategory, updateMutation.isPending],
	);

	return (
		<CategoryDragContext.Provider value={contextValue}>
			<Flex vertical gap={16}>
				<RootDropZone />
				<CategoryTreeNode parentId="null" />
			</Flex>
		</CategoryDragContext.Provider>
	);
}
