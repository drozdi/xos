import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockSectionApi, type IblockSectionListItem } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { RECIPES_BLOCK_CODE, slugifyCode, useContentBlock } from '@/features/iblock-content';
import { useCanManageRecipeCategories } from '@/features/iblock-content/recipeAccess';

function allocateUniqueCategoryCode(name: string, used: Set<string>, fallback = 'category'): string {
	const base = slugifyCode(name || fallback);
	if (!used.has(base)) return base;
	let n = 2;
	while (used.has(`${base}-${n}`)) {
		n += 1;
		if (n > 9999) return `${base}-${Date.now()}`;
	}
	return `${base}-${n}`;
}

export default function RecipeCategoriesApp() {
	useWindowTitle('Категории');
	const queryClient = useQueryClient();
	const canManage = useCanManageRecipeCategories();
	const { blockId, isLoading: blockLoading, error: blockError, isReady } =
		useContentBlock(RECIPES_BLOCK_CODE);

	const [newName, setNewName] = useState('');
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingName, setEditingName] = useState('');

	const listRequest = useMemo(
		() => ({
			t: 'list' as const,
			limit: -1,
			offset: 1,
			sortBy: [{ key: 'sort', order: 'ASC' as const }, { key: 'name', order: 'ASC' as const }],
			filters: blockId ? { block_id: blockId } : {},
		}),
		[blockId],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.sections(listRequest),
		queryFn: () => iblockSectionApi.list(listRequest),
		enabled: canManage && isReady,
	});

	const usedCodes = useMemo(() => {
		const set = new Set<string>();
		for (const item of listQuery.data?.items ?? []) {
			if (item.code) set.add(item.code);
		}
		return set;
	}, [listQuery.data?.items]);

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'sections'] });
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'content', 'sections'] });
	};

	const createMutation = useMutation({
		mutationFn: async (name: string) => {
			if (!blockId) throw new Error('block missing');
			const code = allocateUniqueCategoryCode(name, usedCodes);
			return iblockSectionApi.create({
				name: name.trim(),
				code,
				block_id: blockId,
				sort: ((listQuery.data?.items?.length ?? 0) + 1) * 100,
				active: true,
			});
		},
		onSuccess: () => {
			setNewName('');
			notifications.show({ color: 'green', message: 'Категория создана' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Не удалось создать категорию'),
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, name }: { id: number; name: string }) =>
			iblockSectionApi.update(id, {
				name: name.trim(),
				block_id: blockId,
			}),
		onSuccess: () => {
			setEditingId(null);
			setEditingName('');
			notifications.show({ color: 'green', message: 'Сохранено' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Не удалось сохранить'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockSectionApi.remove(id),
		onSuccess: () => {
			notifications.show({ color: 'green', message: 'Удалено' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const startEdit = (row: IblockSectionListItem) => {
		setEditingId(row.id);
		setEditingName(row.name || '');
	};

	const submitNew = () => {
		const name = newName.trim();
		if (!name) return;
		createMutation.mutate(name);
	};

	if (!canManage) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нужен бит can_category
			</Alert>
		);
	}

	if (blockError) {
		return (
			<Alert color="yellow" title="Каталог не готов" m="md">
				{blockError}
			</Alert>
		);
	}

	const items = listQuery.data?.items ?? [];
	const busy = blockLoading || listQuery.isLoading;

	return (
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<Group
				justify="space-between"
				px="md"
				py="sm"
				style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
			>
				<Text fw={600}>Категории</Text>
				<Button
					size="xs"
					variant="light"
					loading={listQuery.isFetching && !listQuery.isLoading}
					onClick={() => void listQuery.refetch()}
				>
					Обновить
				</Button>
			</Group>

			<Box p="md" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
				{busy ? (
					<Center py="xl">
						<Loader size="sm" />
					</Center>
				) : listQuery.isError ? (
					<Alert color="red" title="Ошибка">
						{extractApiErrorMessage(listQuery.error, 'Не удалось загрузить категории')}
					</Alert>
				) : (
					<Stack gap="sm">
						<Group align="flex-end" wrap="nowrap" gap="xs">
							<TextInput
								style={{ flex: 1 }}
								label="Новая категория"
								placeholder="Название"
								value={newName}
								onChange={(e) => setNewName(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') submitNew();
								}}
								disabled={!isReady || createMutation.isPending}
							/>
							<Button
								leftSection={<IconPlus size={14} />}
								loading={createMutation.isPending}
								disabled={!isReady || !newName.trim()}
								onClick={submitNew}
							>
								Добавить
							</Button>
						</Group>

						{newName.trim() ? (
							<Text size="xs" c="dimmed">
								Код: {allocateUniqueCategoryCode(newName, usedCodes)}
							</Text>
						) : null}

						{items.length === 0 ? (
							<Text c="dimmed" ta="center" py="lg">
								Пока нет категорий. Добавьте первую.
							</Text>
						) : (
							<Stack gap={6}>
								{items.map((row) => {
									const isEditing = editingId === row.id;
									return (
										<Group
											key={row.id}
											justify="space-between"
											wrap="nowrap"
											p="xs"
											style={{
												border: '1px solid var(--mantine-color-default-border)',
												borderRadius: 'var(--mantine-radius-sm)',
											}}
										>
											{isEditing ? (
												<TextInput
													style={{ flex: 1 }}
													value={editingName}
													autoFocus
													onChange={(e) => setEditingName(e.currentTarget.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter' && editingName.trim()) {
															updateMutation.mutate({
																id: row.id,
																name: editingName,
															});
														}
														if (e.key === 'Escape') {
															setEditingId(null);
															setEditingName('');
														}
													}}
												/>
											) : (
												<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
													<Text fw={500} truncate>
														{row.name || 'Без названия'}
													</Text>
													<Text size="xs" c="dimmed" truncate>
														{row.code}
													</Text>
												</Stack>
											)}

											<Group gap={4} wrap="nowrap">
												{isEditing ? (
													<>
														<ActionIcon
															variant="light"
															color="green"
															aria-label="Сохранить"
															loading={updateMutation.isPending}
															disabled={!editingName.trim()}
															onClick={() =>
																updateMutation.mutate({
																	id: row.id,
																	name: editingName,
																})
															}
														>
															<IconCheck size={16} />
														</ActionIcon>
														<ActionIcon
															variant="subtle"
															aria-label="Отмена"
															onClick={() => {
																setEditingId(null);
																setEditingName('');
															}}
														>
															<IconX size={16} />
														</ActionIcon>
													</>
												) : (
													<>
														<ActionIcon
															variant="subtle"
															aria-label="Изменить"
															onClick={() => startEdit(row)}
														>
															<IconPencil size={16} />
														</ActionIcon>
														<ActionIcon
															variant="subtle"
															color="red"
															aria-label="Удалить"
															loading={deleteMutation.isPending}
															onClick={() => {
																confirmAction({
																	title: 'Удаление',
																	message: `Удалить «${row.name || row.code}»?`,
																	confirmLabel: 'Удалить',
																	confirmColor: 'red',
																	onConfirm: () =>
																		deleteMutation.mutateAsync(row.id),
																});
															}}
														>
															<IconTrash size={16} />
														</ActionIcon>
													</>
												)}
											</Group>
										</Group>
									);
								})}
							</Stack>
						)}
					</Stack>
				)}
			</Box>
		</Stack>
	);
}
