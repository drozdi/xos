import { Alert, Select, Stack, Text } from '@mantine/core';
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
	useCanCreateIblockElement,
	useCanDeleteIblockElement,
	useCanReadIblockElement,
	useCanUpdateIblockElement,
} from '@/features/iblock/iblockAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { NOTES_BLOCK_CODE, useContentBlock } from '@/features/iblock-content';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function NotesApp() {
	useWindowTitle('Заметки');
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const userQuery = useUser();
	const canRead = useCanReadIblockElement();
	const canCreate = useCanCreateIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const { blockId, sectionOptions, isLoading: blockLoading, error: blockError, isReady } =
		useContentBlock(NOTES_BLOCK_CODE);
	const [sectionId, setSectionId] = useState<string | null>(null);

	const filters = useMemo(() => {
		const next: Record<string, unknown> = {};
		if (blockId) next.block_id = blockId;
		if (sectionId) next.section_id = Number(sectionId);
		if (userQuery.data?.id) next.accessible_for = userQuery.data.id;
		return next;
	}, [blockId, sectionId, userQuery.data?.id]);

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
			{ field: 'preview_text' as const, header: 'Анонс' },
			{ field: 'section_id' as const, header: 'Раздел', width: 90 },
			{ field: 'sort' as const, header: 'Сорт.', width: 70 },
		],
		[],
	);

	const openNote = (id: number) =>
		launchApp('note', id, blockId ? { blockId } : undefined);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр заметок
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
			title="Заметки"
			total={listQuery.data?.total}
			isLoading={blockLoading || listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить заметки')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate && isReady ? () => openNote(0) : undefined}
			createLabel="Новая заметка"
			filters={
				<Stack gap="xs">
					<Select
						label="Блокнот"
						placeholder="Все разделы"
						data={sectionOptions}
						value={sectionId}
						onChange={setSectionId}
						searchable
						clearable
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="notes-catalog"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openNote(row.id)}
				onEdit={canUpdate ? (row) => openNote(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
