import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Chip,
	Group,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconListDetails, IconStar, IconStarFilled } from '@tabler/icons-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { DataTable, TablePagination, usePaginatedList } from '@/components/table';
import { AuthFileImage } from '@/core/api/AuthFileImage';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockElementApi, type IblockElementListItem } from '@/core/api/endpoints/iblockApi';
import { userDataApi } from '@/core/api/endpoints/userData';
import { queryKeys } from '@/core/api/queryKeys';
import { useUser } from '@/core/auth/hooks';
import { confirmAction } from '@/core/confirm';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockElement,
	useCanDeleteIblockElement,
	useCanReadIblockElement,
	useCanUpdateIblockElement,
} from '@/features/iblock/iblockAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

import {
	ContactsCatalogCards,
	FaqCatalogList,
	GalleryCatalogGrid,
	RecipeCatalogGrid,
	catalogPropertyText,
} from './CatalogListViews';
import { RecipeShareModal } from './RecipeShareModal';
import {
	CONTENT_PROPS,
	type ContentCatalogConfig,
	contentFeatures,
} from './contentCatalog';
import {
	useCanCreateRecipe,
	useCanDeleteRecipe,
	useCanManageRecipeCategories,
	useCanReadRecipe,
	useCanUpdateRecipe,
} from './recipeAccess';
import { useContentBlock } from './useContentBlock';

function favoritesCode(blockCode: string): string {
	return `iblock.favorites.${blockCode}`;
}

export function ContentCatalogListApp({ config }: { config: ContentCatalogConfig }) {
	useWindowTitle(config.listTitle);
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const userQuery = useUser();
	const recipeRead = useCanReadRecipe();
	const recipeCreate = useCanCreateRecipe();
	const recipeUpdate = useCanUpdateRecipe();
	const recipeDelete = useCanDeleteRecipe();
	const canManageCategories = useCanManageRecipeCategories();
	const iblockRead = useCanReadIblockElement();
	const iblockCreate = useCanCreateIblockElement();
	const iblockUpdate = useCanUpdateIblockElement();
	const iblockDelete = useCanDeleteIblockElement();
	const recipeAccess = config.access === 'recipe';
	const canRead = recipeAccess ? recipeRead : iblockRead;
	const canCreate = recipeAccess ? recipeCreate : iblockCreate;
	const canUpdate = recipeAccess ? recipeUpdate : iblockUpdate;
	const canDelete = recipeAccess ? recipeDelete : iblockDelete;
	const features = contentFeatures(config);
	const {
		blockId,
		sectionOptions,
		difficultyOptions,
		isLoading: blockLoading,
		error: blockError,
		isReady,
	} = useContentBlock(config.blockCode);
	const [sectionId, setSectionId] = useState<string | null>(null);
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [tagDraft, setTagDraft] = useState('');
	const [favoritesOnly, setFavoritesOnly] = useState(false);
	const [extraFilter, setExtraFilter] = useState<Record<string, string | null>>({});
	const [shareId, setShareId] = useState<number | null>(null);

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
		enabled: canRead && features.favorites && Boolean(userQuery.data?.id),
	});
	const favoriteIds = favoritesQuery.data ?? [];
	const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

	const filters = useMemo(() => {
		const next: Record<string, unknown> = {};
		if (blockId) {next.block_id = blockId;}
		if (sectionId) {next.section_id = Number(sectionId);}
		if (userQuery.data?.id) {next.accessible_for = userQuery.data.id;}
		if (features.tags && tagFilter) {
			next[`PROPERTY_${CONTENT_PROPS.TAGS}`] = tagFilter;
		}
		if (features.favorites && favoritesOnly) {
			next.id = favoriteIds.length > 0 ? favoriteIds : [-1];
		}
		for (const filter of config.extraFilters ?? []) {
			const value = extraFilter[filter.prop];
			if (value) {
				next[`PROPERTY_${filter.prop}`] = value;
			}
		}
		return next;
	}, [
		blockId,
		sectionId,
		userQuery.data?.id,
		features.tags,
		features.favorites,
		tagFilter,
		favoritesOnly,
		favoriteIds,
		config.extraFilters,
		extraFilter,
	]);

	const pagination = usePaginatedList({ filters });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.elements(pagination.listRequest),
		queryFn: () => iblockElementApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead && isReady && Boolean(userQuery.data?.id),
	});

	const shareQuery = useQuery({
		queryKey: ['iblock', 'element', shareId],
		queryFn: () => iblockElementApi.get(shareId!),
		enabled: shareId !== null,
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

	const toggleFavorite = useCallback((id: number) => {
		const next = favoriteSet.has(id)
			? favoriteIds.filter((x) => x !== id)
			: [...favoriteIds, id];
		favoritesMutation.mutate(next);
	}, [favoriteIds, favoriteSet, favoritesMutation]);

	function applyTagDraft() {
		const value = tagDraft.trim();
		if (!value) {
			return;
		}
		setTagFilter(value);
		setTagDraft('');
	}

	const sectionLabelById = useMemo(() => {
		const map = new Map<number, string>();
		for (const opt of sectionOptions) {
			map.set(Number(opt.value), opt.label);
		}
		return map;
	}, [sectionOptions]);

	const columns = useMemo(() => {
		const cols: Array<{
			field: keyof IblockElementListItem | string;
			header: string;
			width?: number;
			render?: (row: IblockElementListItem) => ReactNode;
		}> = [];
		if (features.favorites) {
			cols.push({
				field: 'favorite',
				header: '',
				width: 44,
				render: (row) => {
					const active = favoriteSet.has(row.id);
					return (
						<ActionIcon
							variant="subtle"
							color={active ? 'yellow' : 'gray'}
							aria-label={active ? 'Убрать из избранного' : 'В избранное'}
							onClick={(event) => {
								event.stopPropagation();
								toggleFavorite(row.id);
							}}
						>
							{active ? <IconStarFilled size={16} /> : <IconStar size={16} />}
						</ActionIcon>
					);
				},
			});
		}
		if (features.cover) {
			cols.push({
				field: 'cover',
				header: '',
				width: 56,
				render: (row) =>
					row.cover?.id ? (
						<AuthFileImage
							lazy
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
			});
		}
		cols.push({ field: 'name', header: config.nameLabel ?? 'Название' });
		cols.push({
			field: 'is_owner',
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
		for (const field of config.extraFields ?? []) {
			cols.push({
				field: field.prop,
				header: field.label,
				width: 140,
				render: (row) => catalogPropertyText(row, field),
			});
		}
		cols.push({
			field: 'section_id',
			header: config.sectionLabel,
			width: 140,
			render: (row) =>
				row.section_id != null
					? (sectionLabelById.get(row.section_id) ?? String(row.section_id))
					: '—',
		});
		cols.push({ field: 'sort', header: 'Сорт.', width: 70 });
		return cols;
	}, [
		config.extraFields,
		config.nameLabel,
		config.previewLabel,
		config.sectionLabel,
		features.cover,
		features.favorites,
		features.preview,
		favoriteSet,
		sectionLabelById,
		toggleFavorite,
	]);

	const openDetail = (id: number, mode?: 'view' | 'edit') =>
		launchApp(config.detailAppId, id, {
			...(blockId ? { blockId } : null),
			...(mode === 'edit' ? { mode: 'edit' } : null),
		});

	const items = listQuery.data?.items ?? [];
	const canShareRow = (row: IblockElementListItem) => Boolean(features.share && row.is_owner);
	const canEditRow = (row: IblockElementListItem) => Boolean(canUpdate && row.can_write);
	const canDeleteRow = (row: IblockElementListItem) => Boolean(canDelete && row.is_owner);

	const deleteOwned = async (row: IblockElementListItem) => {
		if (!row.is_owner) {
			notifications.show({ color: 'yellow', message: 'Удалить может только владелец' });
			return;
		}
		await deleteMutation.mutateAsync(row.id);
	};

	const confirmDelete = (row: IblockElementListItem) => {
		confirmAction({
			title: 'Удаление',
			message: `Удалить «${row.name || row.code}»? Это действие нельзя отменить.`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => deleteOwned(row),
		});
	};

	const listView = config.listView ?? 'table';
	const pageCount = Math.max(1, Math.ceil((listQuery.data?.total ?? 0) / pagination.limit));
	const showSections = Boolean(config.sectionsAppId) && (!recipeAccess || canManageCategories);

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

	const cardProps = {
		items,
		canEditRow,
		canShareRow,
		canDeleteRow,
		onOpen: (row: IblockElementListItem) => openDetail(row.id),
		onEdit: (row: IblockElementListItem) => openDetail(row.id, 'edit'),
		onShare: (row: IblockElementListItem) => setShareId(row.id),
		onDelete: confirmDelete,
	};

	return (
		<>
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
						<Group gap="xs" w="100%">
							<Select
								placeholder={config.sectionPlaceholder ?? 'Все разделы'}
								data={sectionOptions}
								value={sectionId}
								onChange={setSectionId}
								searchable
								clearable
								flex={1}
							/>
							{showSections ? (
								<Button
									variant="light"
									leftSection={<IconListDetails size={16} />}
									onClick={() => void launchApp(config.sectionsAppId!, 0)}
								>
									{config.sectionsButtonLabel ?? 'Разделы'}
								</Button>
							) : null}
						</Group>
						{(config.extraFilters ?? []).map((filter) => (
							<Select
								key={filter.prop}
								label={filter.label}
								placeholder={filter.placeholder ?? 'Любое'}
								data={
									filter.options === 'difficulty'
										? difficultyOptions.map(({ value, label }) => ({ value, label }))
										: [...filter.options]
								}
								value={extraFilter[filter.prop] ?? null}
								onChange={(value) =>
									setExtraFilter((prev) => ({ ...prev, [filter.prop]: value }))
								}
								clearable
							/>
						))}
						{features.favorites ? (
							<Chip
								checked={favoritesOnly}
								onChange={setFavoritesOnly}
								variant="outline"
							>
								Избранное ({favoriteIds.length})
							</Chip>
						) : null}
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
										placeholder="Тег"
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
				{listView === 'table' ? (
					<DataTable
						storageKey={config.storageKey}
						columns={columns as never}
						data={items}
						total={listQuery.data?.total}
						page={pagination.page}
						limit={pagination.limit}
						onPageChange={pagination.onPageChange}
						onLimitChange={pagination.onLimitChange}
						serverPagination
						loading={listQuery.isFetching && !listQuery.isLoading}
						onRowClick={(row) => openDetail(row.id)}
						onShare={features.share ? (row) => setShareId(row.id) : undefined}
						canShareRow={canShareRow}
						onEdit={(row) => openDetail(row.id, 'edit')}
						canEdit={canUpdate}
						canEditRow={canEditRow}
						onDelete={canDelete ? deleteOwned : undefined}
						getRowLabel={(row) => row.name || row.code}
					/>
				) : (
					<Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
						{listView === 'gallery' ? <GalleryCatalogGrid {...cardProps} /> : null}
						{listView === 'contacts' ? <ContactsCatalogCards {...cardProps} /> : null}
						{listView === 'faq' ? <FaqCatalogList {...cardProps} /> : null}
						{listView === 'recipes' ? (
							<RecipeCatalogGrid
								{...cardProps}
								difficultyOptions={difficultyOptions.map(({ value, label }) => ({ value, label }))}
								sectionLabel={(row) =>
									row.section_id != null
										? (sectionLabelById.get(row.section_id) ?? null)
										: null
								}
							/>
						) : null}
						<TablePagination
							mt="md"
							page={pagination.page}
							total={pageCount}
							limit={pagination.limit}
							onChangePage={pagination.onPageChange}
							onChangeLimit={pagination.onLimitChange}
							loading={listQuery.isFetching}
						/>
					</Box>
				)}
			</MainListLayout>

			{shareId !== null ? (
				<RecipeShareModal
					recipe={shareQuery.data ?? null}
					loading={shareQuery.isLoading || shareQuery.isFetching}
					title={`Поделиться: ${config.entityLabel.toLowerCase()}`}
					opened
					onClose={() => setShareId(null)}
					onUpdated={(next) => {
						void queryClient.setQueryData(['iblock', 'element', next.id], next);
						void queryClient.invalidateQueries({ queryKey: ['iblock', 'elements'] });
					}}
				/>
			) : null}
		</>
	);
}
