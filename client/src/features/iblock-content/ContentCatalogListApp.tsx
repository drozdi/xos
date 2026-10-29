import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Chip,
	Group,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { AuthFileImage } from '@/core/api/AuthFileImage';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockElementApi } from '@/core/api/endpoints/iblockApi';
import { userDataApi } from '@/core/api/endpoints/userData';
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
	CONTENT_PROPS,
	type ContentCatalogConfig,
	contentFeatures,
} from './contentCatalog';
import { useContentBlock } from './useContentBlock';

function favoritesCode(blockCode: string): string {
	return `iblock.favorites.${blockCode}`;
}

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
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [tagDraft, setTagDraft] = useState('');
	const [favoritesOnly, setFavoritesOnly] = useState(false);

	const favoritesKey = favoritesCode(config.blockCode);
	const favoritesQuery = useQuery({
		queryKey: ['user-data', favoritesKey],
		queryFn: async () => {
			const row = await userDataApi.getOptional(favoritesKey);
			const value = row?.value;
			if (!Array.isArray(value)) {
				return [] as number[];
			}
			return value.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
		},
		enabled: canRead && Boolean(userQuery.data?.id),
	});
	const favoriteIds = favoritesQuery.data ?? [];
	const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

	const filters = useMemo(() => {
		const next: Record<string, unknown> = {};
		if (blockId) next.block_id = blockId;
		if (sectionId) next.section_id = Number(sectionId);
		if (userQuery.data?.id) next.accessible_for = userQuery.data.id;
		if (features.tags && tagFilter) {
			next[`PROPERTY_${CONTENT_PROPS.TAGS}`] = tagFilter;
		}
		if (favoritesOnly) {
			next.id = favoriteIds.length > 0 ? favoriteIds : [-1];
		}
		return next;
	}, [
		blockId,
		sectionId,
		userQuery.data?.id,
		features.tags,
		tagFilter,
		favoritesOnly,
		favoriteIds,
	]);

	const pagination = usePaginatedList({ filters });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.elements(pagination.listRequest),
		queryFn: () => iblockElementApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
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

	const favoritesMutation = useMutation({
		mutationFn: async (nextIds: number[]) =>
			userDataApi.upsert({ code: favoritesKey, value: nextIds }),
		onSuccess: (_data, nextIds) => {
			queryClient.setQueryData(['user-data', favoritesKey], nextIds);
		},
		onError: (error) => notifyApiError(error, 'Не удалось сохранить избранное'),
	});

	function toggleFavorite(id: number) {
		const next = favoriteSet.has(id)
			? favoriteIds.filter((x) => x !== id)
			: [...favoriteIds, id];
		favoritesMutation.mutate(next);
	}

	function applyTagDraft() {
		const value = tagDraft.trim();
		if (!value) {
			return;
		}
		setTagFilter(value);
		setTagDraft('');
	}

	const columns = useMemo(() => {
		const cols: Array<{
			field: string;
			header: string;
			width?: number;
			render?: (row: Record<string, unknown>) => ReactNode;
		}> = [];
		cols.push({
			field: 'favorite',
			header: '',
			width: 44,
			render: (row) => {
				const id = Number(row.id);
				const active = favoriteSet.has(id);
				return (
					<ActionIcon
						variant="subtle"
						color={active ? 'yellow' : 'gray'}
						aria-label={active ? 'Убрать из избранного' : 'В избранное'}
						onClick={(event) => {
							event.stopPropagation();
							toggleFavorite(id);
						}}
					>
						{active ? <IconStarFilled size={16} /> : <IconStar size={16} />}
					</ActionIcon>
				);
			},
		});
		if (features.cover) {
			cols.push({
				field: 'cover',
				header: '',
				width: 56,
				render: (row) => {
					const cover = row.cover as { id: number; src: string; name: string } | null | undefined;
					return cover?.id ? (
						<AuthFileImage
							lazy
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
	}, [
		config.nameLabel,
		config.previewLabel,
		config.sectionLabel,
		features.cover,
		features.preview,
		favoriteSet,
		favoriteIds,
	]);

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
					<Group gap="xs" w='100%'>
						<Select
							placeholder="Все разделы"
							data={sectionOptions}
							value={sectionId}
							onChange={setSectionId}
							searchable
							clearable
							flex={1}
						/>
						{config.sectionsAppId && (
							<Button
								variant="light"
								onClick={() => void launchApp(config.sectionsAppId!, 0)}
							>
								{config.sectionsButtonLabel ?? 'Разделы'}
							</Button>
						)}
					</Group>
					<Chip
						checked={favoritesOnly}
						onChange={setFavoritesOnly}
						variant="outline"
					>
						Избранное ({favoriteIds.length})
					</Chip>
					{features.tags ? (
						<Stack gap={6}>
							<Text size="sm" fw={500}>
								Тег
							</Text>
							<Group gap="xs">
								{tagFilter ? (
									<Chip checked onChange={() => setTagFilter(null)}>
										{tagFilter}
									</Chip>
								) : null}
								<TextInput
									placeholder="PROPERTY_TAGS…"
									size="xs"
									value={tagDraft}
									onChange={(e) => setTagDraft(e.currentTarget.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											applyTagDraft();
										}
									}}
									w={160}
								/>
								<Button size="xs" variant="light" onClick={applyTagDraft} disabled={!tagDraft.trim()}>
									Фильтр
								</Button>
							</Group>
						</Stack>
					) : null}
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
