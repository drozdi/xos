import { Alert, Badge, Button, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';

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
} from '@/features/iblock/iblockAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

import {
	type ContentCatalogConfig,
	contentFeatures,
} from './contentCatalog';
import { useContentBlock } from './useContentBlock';

export function ContentCatalogListApp({ config }: { config: ContentCatalogConfig }) {
	useWindowTitle(config.listTitle);
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const userQuery = useUser();
	const canRead = useCanReadIblockElement();
	const canCreate = useCanCreateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const features = contentFeatures(config);
	const { blockId, sectionOptions, isLoading: blockLoading, error: blockError, isReady } =
		useContentBlock(config.blockCode);
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

	const columns = useMemo(() => {
		const cols: Array<{
			field: string;
			header: string;
			width?: number;
			render?: (row: Record<string, unknown>) => ReactNode;
		}> = [];
		if (features.cover) {
			cols.push({
				field: 'cover',
				header: '',
				width: 56,
				render: (row) => {
					const cover = row.cover as { id: number; src: string; name: string } | null | undefined;
					return cover?.id ? (
						<AuthFileImage
							fileId={cover.id}
							h={32}
							w={32}
							radius="sm"
							fit="cover"
						/>
					) : (
						<Text size="xs" c="dimmed">
							—
						</Text>
					);
				},
			});
		}
		cols.push({ field: 'name', header: config.nameLabel ?? 'Название' });
		cols.push({
			field: 'access',
			header: 'Доступ',
			width: 110,
			render: (row) =>
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
		});
		if (features.preview) {
			cols.push({ field: 'preview_text', header: config.previewLabel ?? 'Анонс' });
		}
		cols.push({ field: 'section_id', header: config.sectionLabel, width: 90 });
		cols.push({ field: 'sort', header: 'Сорт.', width: 70 });
		return cols;
	}, [config.nameLabel, config.previewLabel, config.sectionLabel, features.cover, features.preview]);

	const openDetail = (id: number) =>
		launchApp(config.detailAppId, id, blockId ? { blockId } : undefined);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр
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
			title={config.listTitle}
			total={listQuery.data?.total}
			isLoading={blockLoading || listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить список')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate && isReady ? () => openDetail(0) : undefined}
			createLabel={config.createLabel}
			filters={
				<Stack gap="xs">
					{config.sectionsAppId ? (
						<Group gap="xs">
							<Button
								size="xs"
								variant="light"
								onClick={() => void launchApp(config.sectionsAppId!, 0)}
							>
								{config.sectionsButtonLabel ?? 'Разделы'}
							</Button>
						</Group>
					) : null}
					<Select
						label={config.sectionLabel}
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
				storageKey={config.storageKey}
				columns={columns as never}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openDetail(row.id)}
				onDelete={
					canDelete
						? async (row) => {
								if (!row.is_owner) {
									notifications.show({
										color: 'yellow',
										message: 'Удалить может только владелец',
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
