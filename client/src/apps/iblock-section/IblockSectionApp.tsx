import {
	Alert,
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	Switch,
	Table,
	Tabs,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import {
	iblockBlockApi,
	iblockPropertyApi,
	iblockSectionApi,
	iblockSectionPropertyApi,
	type IblockSectionDetail,
	type IblockSectionPropertyListItem,
} from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	canCreateCatalogSection,
	useCanDeleteCatalogSection,
	useCanReadCatalogSection,
	useCanUpdateCatalogSection,
} from '@/features/iblock-content/catalogAccess';
import { useEntityId, useIblockLaunchProps } from '@/features/iblock/iblockAppUtils';
import { IblockImageField } from '@/features/iblock-content';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateIblockSectionForm } from './iblockSectionValidation';

const initialData: IblockSectionDetail = {
	id: 0,
	code: '',
	name: '',
	description: '',
	sort: 0,
	level: 0,
	active: true,
	active_from: '',
	active_to: '',
	block_id: null,
	parent_id: null,
	element_filter: null,
	inherited_element_filter: null,
	preview_image: null,
	detail_image: null,
	preview_image_id: null,
	detail_image_id: null,
	x_timestamp: '',
	date_created: '',
	created_by: null,
	updated_by: null,
};

type SectionPropertyDraft = {
	property_id: string | null;
	smart_filter: boolean;
	display_type: string;
	display_expanded: boolean;
	sort: number;
	active: boolean;
};

const emptyDraft: SectionPropertyDraft = {
	property_id: null,
	smart_filter: false,
	display_type: 'A',
	display_expanded: false,
	sort: 500,
	active: true,
};

function ElementFilterEditor({
	value,
	inherited,
	readOnly,
	onChange,
}: {
	value: Record<string, unknown> | null;
	inherited: Record<string, unknown> | null;
	readOnly: boolean;
	onChange: (next: Record<string, unknown> | null) => void;
}) {
	const rows = useMemo(() => {
		const entries = Object.entries(value ?? {});
		if (entries.length === 0) {
			return [{ key: '', value: '' }];
		}
		return entries.map(([key, val]) => ({
			key,
			value: val == null ? '' : String(val),
		}));
	}, [value]);

	const setRows = (nextRows: Array<{ key: string; value: string }>) => {
		const next: Record<string, unknown> = {};
		for (const row of nextRows) {
			const k = row.key.trim();
			if (!k) continue;
			next[k] = row.value;
		}
		onChange(Object.keys(next).length > 0 ? next : null);
	};

	const inheritedText = useMemo(() => {
		const entries = Object.entries(inherited ?? {});
		if (entries.length === 0) return 'нет';
		return entries.map(([k, v]) => `${k}=${String(v)}`).join(', ');
	}, [inherited]);

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				Унаследованный фильтр (root→leaf): {inheritedText}
			</Text>
			{rows.map((row, index) => (
				<Group key={index} gap="xs" align="flex-end" grow>
					<TextInput
						label={index === 0 ? 'Ключ (PROPERTY_CODE / active / code…)' : undefined}
						value={row.key}
						readOnly={readOnly}
						onChange={(e) => {
							const next = rows.map((item, i) =>
								i === index ? { ...item, key: e.currentTarget.value } : item,
							);
							setRows(next);
						}}
					/>
					<TextInput
						label={index === 0 ? 'Значение' : undefined}
						value={row.value}
						readOnly={readOnly}
						onChange={(e) => {
							const next = rows.map((item, i) =>
								i === index ? { ...item, value: e.currentTarget.value } : item,
							);
							setRows(next);
						}}
					/>
					{!readOnly ? (
						<Button
							size="compact-sm"
							variant="subtle"
							color="red"
							onClick={() => setRows(rows.filter((_, i) => i !== index))}
						>
							−
						</Button>
					) : null}
				</Group>
			))}
			{!readOnly ? (
				<Button
					size="compact-sm"
					variant="light"
					onClick={() => setRows([...rows, { key: '', value: '' }])}
				>
					Добавить условие
				</Button>
			) : null}
		</Stack>
	);
}

function SectionPropertiesEditor({
	sectionId,
	blockId,
	readOnly,
}: {
	sectionId: number;
	blockId: number | null;
	readOnly: boolean;
}) {
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<SectionPropertyDraft>(emptyDraft);
	const [editingId, setEditingId] = useState<number | null>(null);

	const listRequest = useMemo(
		() => ({
			t: 'list' as const,
			limit: -1,
			offset: 1,
			filters: { section_id: sectionId },
		}),
		[sectionId],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.sectionProperties(listRequest),
		queryFn: () => iblockSectionPropertyApi.list(listRequest),
		enabled: sectionId > 0,
	});

	const propertiesQuery = useQuery({
		queryKey: ['iblock', 'properties', 'by-block', blockId],
		queryFn: () =>
			iblockPropertyApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: blockId },
			}),
		enabled: blockId != null && blockId > 0,
	});

	const propertyOptions = useMemo(
		() =>
			(propertiesQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[propertiesQuery.data?.items],
	);

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'sectionProperties'] });
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			const propertyId = draft.property_id ? Number(draft.property_id) : 0;
			if (!propertyId) {
				throw new Error('Выберите свойство');
			}
			const body = {
				section_id: sectionId,
				property_id: propertyId,
				block_id: blockId,
				smart_filter: draft.smart_filter,
				display_type: draft.display_type,
				display_expanded: draft.display_expanded,
				sort: draft.sort,
				active: draft.active,
			};
			if (editingId) {
				return iblockSectionPropertyApi.update(editingId, body);
			}
			return iblockSectionPropertyApi.create(body);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			setDraft(emptyDraft);
			setEditingId(null);
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockSectionPropertyApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const startEdit = (row: IblockSectionPropertyListItem) => {
		setEditingId(row.id);
		setDraft({
			property_id: row.property_id != null ? String(row.property_id) : null,
			smart_filter: Boolean(row.smart_filter),
			display_type: row.display_type || 'A',
			display_expanded: Boolean(row.display_expanded),
			sort: row.sort ?? 500,
			active: Boolean(row.active),
		});
	};

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Stack gap="xs">
					<Select
						label="Свойство"
						data={propertyOptions}
						value={draft.property_id}
						onChange={(value) => setDraft((prev) => ({ ...prev, property_id: value }))}
						searchable
						clearable
					/>
					<TextInput
						label="Тип отображения"
						value={draft.display_type}
						onChange={(e) =>
							setDraft((prev) => ({ ...prev, display_type: e.currentTarget.value }))
						}
					/>
					<NumberInput
						label="Сортировка"
						value={draft.sort}
						onChange={(value) =>
							setDraft((prev) => ({
								...prev,
								sort: typeof value === 'number' ? value : 0,
							}))
						}
					/>
					<Switch
						label="Умный фильтр"
						checked={draft.smart_filter}
						onChange={(e) =>
							setDraft((prev) => ({ ...prev, smart_filter: e.currentTarget.checked }))
						}
					/>
					<Switch
						label="Развёрнуто"
						checked={draft.display_expanded}
						onChange={(e) =>
							setDraft((prev) => ({
								...prev,
								display_expanded: e.currentTarget.checked,
							}))
						}
					/>
					<Switch
						label="Активен"
						checked={draft.active}
						onChange={(e) =>
							setDraft((prev) => ({ ...prev, active: e.currentTarget.checked }))
						}
					/>
					<Group gap="xs">
						<Button
							size="compact-sm"
							loading={saveMutation.isPending}
							onClick={() => saveMutation.mutate()}
						>
							{editingId ? 'Обновить' : 'Добавить'}
						</Button>
						{editingId ? (
							<Button
								size="compact-sm"
								variant="default"
								onClick={() => {
									setEditingId(null);
									setDraft(emptyDraft);
								}}
							>
								Отмена
							</Button>
						) : null}
					</Group>
				</Stack>
			) : null}

			<Table striped withTableBorder>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>ID</Table.Th>
						<Table.Th>Свойство</Table.Th>
						<Table.Th>Фильтр</Table.Th>
						<Table.Th>Тип</Table.Th>
						<Table.Th>Сорт.</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{(listQuery.data?.items ?? []).map((row) => (
						<Table.Tr key={row.id}>
							<Table.Td>{row.id}</Table.Td>
							<Table.Td>{row.property_id}</Table.Td>
							<Table.Td>{row.smart_filter ? 'да' : 'нет'}</Table.Td>
							<Table.Td>{row.display_type}</Table.Td>
							<Table.Td>{row.sort}</Table.Td>
							<Table.Td>
								{!readOnly ? (
									<Group gap={4}>
										<Button size="compact-xs" variant="subtle" onClick={() => startEdit(row)}>
											Изменить
										</Button>
										<Button
											size="compact-xs"
											variant="subtle"
											color="red"
											onClick={() => void deleteMutation.mutateAsync(row.id)}
										>
											Удалить
										</Button>
									</Group>
								) : null}
							</Table.Td>
						</Table.Tr>
					))}
					{(listQuery.data?.items ?? []).length === 0 ? (
						<Table.Tr>
							<Table.Td colSpan={6}>
								<Text size="sm" c="dimmed">
									Нет привязок свойств
								</Text>
							</Table.Td>
						</Table.Tr>
					) : null}
				</Table.Tbody>
			</Table>
		</Stack>
	);
}

export default function IblockSectionApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadCatalogSection();
	const canUpdate = useCanUpdateCatalogSection();
	const canDelete = useCanDeleteCatalogSection();
	const canCreate = canCreateCatalogSection();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const blocksQuery = useQuery({
		queryKey: ['iblock', 'blocks', 'select-all'],
		queryFn: () =>
			iblockBlockApi.list({ t: 'list', limit: -1, offset: 1, filters: {} }),
	});

	const blockOptions = useMemo(
		() =>
			(blocksQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[blocksQuery.data?.items],
	);

	const buildNewData = useCallback(async (): Promise<IblockSectionDetail> => {
		const blockId = Number(launchProps.blockId);
		return {
			...initialData,
			block_id: Number.isFinite(blockId) && blockId > 0 ? blockId : null,
		};
	}, [launchProps.blockId]);

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание раздела
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр раздела
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Раздел"
			queryKey={['iblock', 'section']}
			listQueryKey={['iblock', 'sections']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockSectionApi.get}
			save={iblockSectionApi.update}
			create={iblockSectionApi.create}
			remove={iblockSectionApi.remove}
			initialData={initialData}
			buildNewData={buildNewData}
			validate={validateIblockSectionForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly, isNew: isNewRecord }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						{!isNewRecord ? <Tabs.Tab value="element-filter">Фильтр элементов</Tabs.Tab> : null}
						{!isNewRecord ? <Tabs.Tab value="filter">Фильтр свойств</Tabs.Tab> : null}
					</Tabs.List>

					<Tabs.Panel value="general" pt="sm">
						<Stack gap="sm">
							<Select
								label="Инфоблок"
								withAsterisk
								data={blockOptions}
								value={data.block_id != null ? String(data.block_id) : null}
								error={errors.block_id}
								readOnly={readOnly}
								onChange={(value) => setField('block_id', value ? Number(value) : null)}
								searchable
								clearable
							/>
							<NumberInput
								label="Родитель (ID)"
								value={data.parent_id ?? undefined}
								readOnly={readOnly}
								onChange={(value) =>
									setField('parent_id', typeof value === 'number' ? value : null)
								}
								allowDecimal={false}
							/>
							<TextInput
								label="Код"
								withAsterisk
								value={data.code ?? ''}
								error={errors.code}
								readOnly={readOnly}
								onChange={(e) => setField('code', e.currentTarget.value)}
							/>
							<TextInput
								label="Название"
								withAsterisk
								value={data.name ?? ''}
								error={errors.name}
								readOnly={readOnly}
								onChange={(e) => setField('name', e.currentTarget.value)}
							/>
							<TextInput
								label="Описание"
								value={data.description ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('description', e.currentTarget.value)}
							/>
							<IblockImageField
								label="Картинка анонса"
								value={data.preview_image}
								readOnly={readOnly}
								onChange={(next) => {
									setField('preview_image', next);
									setField('preview_image_id', next?.id ?? null);
								}}
							/>
							<IblockImageField
								label="Детальная картинка"
								value={data.detail_image}
								readOnly={readOnly}
								onChange={(next) => {
									setField('detail_image', next);
									setField('detail_image_id', next?.id ?? null);
								}}
							/>
							<NumberInput
								label="Сортировка"
								value={data.sort ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
							/>
							<NumberInput
								label="Уровень"
								value={data.level ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('level', typeof value === 'number' ? value : 0)}
							/>
							<Switch
								label="Активен"
								checked={Boolean(data.active)}
								disabled={readOnly}
								onChange={(e) => setField('active', e.currentTarget.checked)}
							/>
							<TextInput
								label="Активен с"
								value={data.active_from ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('active_from', e.currentTarget.value)}
							/>
							<TextInput
								label="Активен по"
								value={data.active_to ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('active_to', e.currentTarget.value)}
							/>
						</Stack>
					</Tabs.Panel>

					{!isNewRecord ? (
						<Tabs.Panel value="element-filter" pt="sm">
							<ElementFilterEditor
								value={data.element_filter}
								inherited={data.inherited_element_filter}
								readOnly={readOnly}
								onChange={(next) => setField('element_filter', next)}
							/>
						</Tabs.Panel>
					) : null}

					{!isNewRecord ? (
						<Tabs.Panel value="filter" pt="sm">
							<SectionPropertiesEditor
								sectionId={entityId}
								blockId={data.block_id}
								readOnly={readOnly}
							/>
						</Tabs.Panel>
					) : null}
				</Tabs>
			)}
		</MainEntityForm>
	);
}
