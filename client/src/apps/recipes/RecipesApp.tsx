import { Alert, Badge, Button, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { AuthFileImage } from '@/core/api/AuthFileImage';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockElementApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useUser } from '@/core/auth/hooks';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateRecipe,
	useCanDeleteRecipe,
	useCanManageRecipeCategories,
	useCanReadRecipe,
} from '@/features/iblock-content/recipeAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { RECIPES_BLOCK_CODE, useContentBlock } from '@/features/iblock-content';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function RecipesApp() {
	useWindowTitle('Рецепты');
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const userQuery = useUser();
	const canRead = useCanReadRecipe();
	const canCreate = useCanCreateRecipe();
	const canDelete = useCanDeleteRecipe();
	const canManageCategories = useCanManageRecipeCategories();
	const {
		blockId,
		sectionOptions,
		difficultyOptions,
		isLoading: blockLoading,
		error: blockError,
		isReady,
	} = useContentBlock(RECIPES_BLOCK_CODE);
	const [sectionId, setSectionId] = useState<string | null>(null);
	const [difficulty, setDifficulty] = useState<string | null>(null);

	const filters = useMemo(() => {
		const next: Record<string, unknown> = {};
		if (blockId) next.block_id = blockId;
		if (sectionId) next.section_id = Number(sectionId);
		if (difficulty) next.PROPERTY_DIFFICULTY = difficulty;
		if (userQuery.data?.id) next.accessible_for = userQuery.data.id;
		return next;
	}, [blockId, sectionId, difficulty, userQuery.data?.id]);

	const pagination = usePaginatedList({ filters });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.elements(pagination.listRequest),
		queryFn: () => iblockElementApi.list(pagination.listRequest),
		enabled: canRead && isReady && Boolean(userQuery.data?.id),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockElementApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['iblock', 'elements'] });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{
				field: 'cover' as const,
				header: '',
				width: 56,
				render: (row: { cover?: { id: number; src: string; name: string } | null }) =>
					row.cover?.id ? (
						<AuthFileImage
							fileId={row.cover.id}
							alt={row.cover.name}
							h={32}
							w={32}
							radius="sm"
							fit="cover"
						/>
					) : (
						<Text size="xs" c="dimmed">
							—
						</Text>
					),
			},
			{ field: 'name' as const, header: 'Название' },
			{
				field: 'access' as const,
				header: 'Доступ',
				width: 110,
				render: (row: { is_owner?: boolean; is_shared?: boolean }) =>
					row.is_owner ? (
						<Badge size="sm" variant="light">
							Мой
						</Badge>
					) : row.is_shared ? (
						<Badge size="sm" variant="light" color="blue">
							Общий
						</Badge>
					) : (
						<Text size="xs" c="dimmed">
							—
						</Text>
					),
			},
			{ field: 'preview_text' as const, header: 'Анонс' },
			{ field: 'section_id' as const, header: 'Раздел', width: 90 },
			{ field: 'sort' as const, header: 'Сорт.', width: 70 },
		],
		[],
	);

	const openRecipe = (id: number) =>
		launchApp('recipe', id, blockId ? { blockId } : undefined);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр рецептов
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

	return (
		<MainListLayout
			title="Рецепты"
			total={listQuery.data?.total}
			isLoading={blockLoading || listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить рецепты')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate && isReady ? () => openRecipe(0) : undefined}
			createLabel="Новый рецепт"
			filters={
				<Stack gap="xs">
					{canManageCategories ? (
						<Group gap="xs">
							<Button
								size="xs"
								variant="light"
								onClick={() => void launchApp('recipe-categories', 0)}
							>
								Категории
							</Button>
						</Group>
					) : null}
					<Select
						label="Категория"
						placeholder="Все категории"
						data={sectionOptions}
						value={sectionId}
						onChange={setSectionId}
						searchable
						clearable
					/>
					<Select
						label="Сложность"
						placeholder="Любая"
						data={difficultyOptions}
						value={difficulty}
						onChange={setDifficulty}
						clearable
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="recipes-catalog"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openRecipe(row.id)}
				onDelete={
					canDelete
						? async (row) => {
								if (!row.is_owner) {
									notifications.show({
										color: 'yellow',
										message: 'Удалить может только владелец рецепта',
									});
									return;
								}
								await deleteMutation.mutateAsync(row.id);
							}
						: undefined
				}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
