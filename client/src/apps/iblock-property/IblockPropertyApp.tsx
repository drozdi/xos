import {
	Alert,
	Button,
	Group,
	NumberInput,
	Radio,
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
	iblockPropertyEnumApi,
	type IblockPropertyDetail,
	type IblockPropertyEnumListItem,
} from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';

import {
	canCreateIblockProperty,
	useCanDeleteIblockProperty,
	useCanReadIblockProperty,
	useCanUpdateIblockProperty,
} from '@/features/iblock/iblockAccess';
import { useEntityId, useIblockLaunchProps } from '@/features/iblock/iblockAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateIblockPropertyForm } from './iblockPropertyValidation';

const FIELD_TYPE_OPTIONS = [
	{ value: 'S', label: 'Строка' },
	{ value: 'N', label: 'Число' },
	{ value: 'F', label: 'Файл' },
	{ value: 'L', label: 'Список' },
	{ value: 'E', label: 'Привязка к элементу' },
	{ value: 'G', label: 'Привязка к разделу' },
	{ value: 'P', label: 'Прототип' },
];

const MEMBER_FIELD_TYPE_OPTIONS = FIELD_TYPE_OPTIONS.filter((item) => item.value !== 'P');

const LIST_TYPE_OPTIONS = [
	{ value: 'L', label: 'Выпадающий список' },
	{ value: 'C', label: 'Флажки' },
];

function normalizeListType(value: string | null | undefined): string {
	return (value ?? '').toUpperCase() === 'C' ? 'C' : 'L';
}

const FILE_TYPE_PRESETS = [
	{ value: '', label: 'Любой файл' },
	{ value: 'image', label: 'Изображения' },
	{ value: 'jpg,jpeg,png,gif,webp', label: 'jpg / png / gif / webp' },
	{ value: 'pdf', label: 'PDF' },
];

const initialData: IblockPropertyDetail = {
	id: 0,
	code: '',
	name: '',
	description: '',
	sort: 0,
	active: true,
	required: false,
	multiple: false,
	field_type: 'S',
	file_type: '',
	list_type: '',
	default_value: '',
	postfix: '',
	prefix: '',
	active_from: '',
	active_to: '',
	block_id: null,
	parent_id: null,
	link_iblock_id: null,
	children: [],
	x_timestamp: '',
	date_created: '',
};

type EnumDraft = {
	code: string;
	name: string;
	sort: number;
	default: boolean;
};

const emptyEnumDraft: EnumDraft = {
	code: '',
	name: '',
	sort: 500,
	default: false,
};

function PropertyEnumsEditor({
	propertyId,
	readOnly,
}: {
	propertyId: number;
	readOnly: boolean;
}) {
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<EnumDraft>(emptyEnumDraft);
	const [editingId, setEditingId] = useState<number | null>(null);

	const listRequest = useMemo(
		() => ({
			t: 'list' as const,
			limit: -1,
			offset: 1,
			filters: { property_id: propertyId },
		}),
		[propertyId],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.propertyEnums(listRequest),
		queryFn: () => iblockPropertyEnumApi.list(listRequest),
		enabled: propertyId > 0,
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'propertyEnums'] });
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!draft.code.trim() || !draft.name.trim()) {
				throw new Error('Код и название обязательны');
			}
			const body = {
				property_id: propertyId,
				code: draft.code,
				name: draft.name,
				sort: draft.sort,
				default: draft.default,
			};
			if (editingId) {
				return iblockPropertyEnumApi.update(editingId, body);
			}
			return iblockPropertyEnumApi.create(body);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			setDraft(emptyEnumDraft);
			setEditingId(null);
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockPropertyEnumApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const setDefaultMutation = useMutation({
		mutationFn: async (row: IblockPropertyEnumListItem) => {
			await iblockPropertyEnumApi.update(row.id, {
				...row,
				property_id: propertyId,
				default: true,
			});
			const others = (listQuery.data?.items ?? []).filter((item) => item.id !== row.id && item.default);
			await Promise.all(
				others.map((item) =>
					iblockPropertyEnumApi.update(item.id, {
						...item,
						property_id: propertyId,
						default: false,
					}),
				),
			);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const startEdit = (row: IblockPropertyEnumListItem) => {
		setEditingId(row.id);
		setDraft({
			code: row.code ?? '',
			name: row.name ?? '',
			sort: row.sort ?? 500,
			default: Boolean(row.default),
		});
	};

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Stack gap="xs">
					<TextInput
						label="Код"
						value={draft.code}
						onChange={(e) => setDraft((prev) => ({ ...prev, code: e.currentTarget.value }))}
					/>
					<TextInput
						label="Название"
						value={draft.name}
						onChange={(e) => setDraft((prev) => ({ ...prev, name: e.currentTarget.value }))}
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
						label="По умолчанию"
						checked={draft.default}
						onChange={(e) =>
							setDraft((prev) => ({ ...prev, default: e.currentTarget.checked }))
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
									setDraft(emptyEnumDraft);
								}}
							>
								Отмена
							</Button>
						) : null}
					</Group>
				</Stack>
			) : null}

			<Radio.Group
				value={
					(listQuery.data?.items ?? []).find((item) => item.default)?.id != null
						? String((listQuery.data?.items ?? []).find((item) => item.default)?.id)
						: ''
				}
				onChange={(value) => {
					const row = (listQuery.data?.items ?? []).find((item) => String(item.id) === value);
					if (row && !readOnly) {
						void setDefaultMutation.mutateAsync(row);
					}
				}}
			>
				<Table striped withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>По умолч.</Table.Th>
							<Table.Th>Код</Table.Th>
							<Table.Th>Название</Table.Th>
							<Table.Th>Сорт.</Table.Th>
							<Table.Th />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(listQuery.data?.items ?? []).map((row) => (
							<Table.Tr key={row.id}>
								<Table.Td>
									<Radio value={String(row.id)} disabled={readOnly} />
								</Table.Td>
								<Table.Td>{row.code}</Table.Td>
								<Table.Td>{row.name}</Table.Td>
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
								<Table.Td colSpan={5}>
									<Text size="sm" c="dimmed">
										Нет значений списка
									</Text>
								</Table.Td>
							</Table.Tr>
						) : null}
					</Table.Tbody>
				</Table>
			</Radio.Group>
		</Stack>
	);
}

type FieldDraft = {
	id: number | null;
	code: string;
	name: string;
	field_type: string;
	multiple: boolean;
	file_type: string;
	link_iblock_id: number | null;
	sort: number;
};

const emptyFieldDraft: FieldDraft = {
	id: null,
	code: '',
	name: '',
	field_type: 'S',
	multiple: false,
	file_type: '',
	link_iblock_id: null,
	sort: 100,
};

function PrototypeFieldsEditor({
	propertyId,
	blockId,
	readOnly,
	blockOptions,
}: {
	propertyId: number;
	blockId: number | null;
	readOnly: boolean;
	blockOptions: { value: string; label: string }[];
}) {
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<FieldDraft>(emptyFieldDraft);

	const listRequest = useMemo(
		() => ({
			t: 'list' as const,
			limit: -1,
			offset: 1,
			filters: { parent_id: propertyId, block_id: blockId },
		}),
		[blockId, propertyId],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.properties(listRequest),
		queryFn: async () => {
			const list = await iblockPropertyApi.list(listRequest);
			return Promise.all(list.items.map((item) => iblockPropertyApi.get(item.id)));
		},
		enabled: propertyId > 0,
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'properties'] });
		void queryClient.invalidateQueries({ queryKey: ['iblock', 'property'] });
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!draft.code.trim() || !draft.name.trim()) {
				throw new Error('Код и название обязательны');
			}
			if (blockId == null || blockId <= 0) {
				throw new Error('Сначала укажите инфоблок');
			}
			const body = {
				code: draft.code.trim(),
				name: draft.name.trim(),
				field_type: draft.field_type,
				multiple: draft.multiple,
				file_type: draft.field_type === 'F' ? draft.file_type : '',
				link_iblock_id:
					draft.field_type === 'E' || draft.field_type === 'G' ? draft.link_iblock_id : null,
				sort: draft.sort,
				active: true,
				required: false,
				block_id: blockId,
				parent_id: propertyId,
			};
			if (draft.id) {
				return iblockPropertyApi.update(draft.id, body);
			}
			return iblockPropertyApi.create(body);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			setDraft(emptyFieldDraft);
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockPropertyApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			if (draft.id) {
				setDraft(emptyFieldDraft);
			}
			invalidate();
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const rows = listQuery.data ?? [];
	const needsLink = draft.field_type === 'E' || draft.field_type === 'G';

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				Поля прототипа. Если свойство обязательное, при сохранении элемента заполняются все поля.
			</Text>
			{!readOnly ? (
				<Stack gap="xs">
					<TextInput
						label="Код"
						value={draft.code}
						onChange={(e) => setDraft((prev) => ({ ...prev, code: e.currentTarget.value }))}
					/>
					<TextInput
						label="Название"
						value={draft.name}
						onChange={(e) => setDraft((prev) => ({ ...prev, name: e.currentTarget.value }))}
					/>
					<Select
						label="Тип"
						data={MEMBER_FIELD_TYPE_OPTIONS}
						value={draft.field_type}
						onChange={(value) =>
							setDraft((prev) => ({
								...prev,
								field_type: value ?? 'S',
								file_type: value === 'F' ? prev.file_type : '',
								link_iblock_id: value === 'E' || value === 'G' ? prev.link_iblock_id : null,
							}))
						}
					/>
					<Switch
						label="Множественное"
						checked={draft.multiple}
						onChange={(e) => setDraft((prev) => ({ ...prev, multiple: e.currentTarget.checked }))}
					/>
					{draft.field_type === 'F' ? (
						<TextInput
							label="Тип файла"
							description="Пусто — любой; image — картинки; расширения jpg,png или mime image/*"
							value={draft.file_type}
							onChange={(e) => setDraft((prev) => ({ ...prev, file_type: e.currentTarget.value }))}
						/>
					) : null}
					{needsLink ? (
						<Select
							label="Инфоблок привязки"
							data={blockOptions}
							value={draft.link_iblock_id != null ? String(draft.link_iblock_id) : null}
							onChange={(value) =>
								setDraft((prev) => ({ ...prev, link_iblock_id: value ? Number(value) : null }))
							}
							searchable
							clearable
						/>
					) : null}
					<NumberInput
						label="Сортировка"
						value={draft.sort}
						onChange={(value) =>
							setDraft((prev) => ({ ...prev, sort: typeof value === 'number' ? value : 100 }))
						}
					/>
					<Group>
						<Button size="xs" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
							{draft.id ? 'Сохранить поле' : 'Добавить поле'}
						</Button>
						{draft.id ? (
							<Button size="xs" variant="default" onClick={() => setDraft(emptyFieldDraft)}>
								Отмена
							</Button>
						) : null}
					</Group>
					{draft.id && draft.field_type === 'L' ? (
						<PropertyEnumsEditor propertyId={draft.id} readOnly={readOnly} />
					) : null}
				</Stack>
			) : null}
			<Table>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Код</Table.Th>
						<Table.Th>Название</Table.Th>
						<Table.Th>Тип</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{rows.map((row) => (
						<Table.Tr key={row.id}>
							<Table.Td>{row.code}</Table.Td>
							<Table.Td>{row.name}</Table.Td>
							<Table.Td>{row.field_type}</Table.Td>
							<Table.Td>
								{!readOnly ? (
									<Group gap="xs">
										<Button
											size="compact-xs"
											variant="light"
											onClick={() =>
												setDraft({
													id: row.id,
													code: row.code ?? '',
													name: row.name ?? '',
													field_type: (row.field_type ?? 'S').toUpperCase(),
													multiple: Boolean(row.multiple),
													file_type: row.file_type ?? '',
													link_iblock_id: row.link_iblock_id ?? null,
													sort: row.sort ?? 100,
												})
											}
										>
											Изменить
										</Button>
										<Button
											size="compact-xs"
											variant="light"
											color="red"
											onClick={() => deleteMutation.mutate(row.id)}
										>
											Удалить
										</Button>
									</Group>
								) : null}
							</Table.Td>
						</Table.Tr>
					))}
					{rows.length === 0 ? (
						<Table.Tr>
							<Table.Td colSpan={4}>
								<Text size="sm" c="dimmed">
									Нет полей
								</Text>
							</Table.Td>
						</Table.Tr>
					) : null}
				</Table.Tbody>
			</Table>
		</Stack>
	);
}

export default function IblockPropertyApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadIblockProperty();
	const canUpdate = useCanUpdateIblockProperty();
	const canDelete = useCanDeleteIblockProperty();
	const canCreate = canCreateIblockProperty();
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

	const buildNewData = useCallback(async (): Promise<IblockPropertyDetail> => {
		const blockId = Number(launchProps.blockId);
		return {
			...initialData,
			block_id: Number.isFinite(blockId) && blockId > 0 ? blockId : null,
		};
	}, [launchProps.blockId]);

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание свойства
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр свойства
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Свойство инфоблока"
			queryKey={['iblock', 'property']}
			listQueryKey={['iblock', 'properties']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockPropertyApi.get}
			save={iblockPropertyApi.update}
			create={iblockPropertyApi.create}
			remove={iblockPropertyApi.remove}
			initialData={initialData}
			buildNewData={buildNewData}
			validate={validateIblockPropertyForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly, isNew: isNewRecord }) => {
				const fieldType = (data.field_type ?? '').toUpperCase();
				const isListType = fieldType === 'L';
				const isFileType = fieldType === 'F';
				const isPrototype = fieldType === 'P';
				const needsLinkIblock = fieldType === 'E' || fieldType === 'G';

				return (
					<Tabs value={activeTab} onChange={setActiveTab}>
						<Tabs.List>
							<Tabs.Tab value="general">Общие</Tabs.Tab>
							{!isNewRecord && isListType ? (
								<Tabs.Tab value="enums">Значения списка</Tabs.Tab>
							) : null}
							{!isNewRecord && isPrototype ? (
								<Tabs.Tab value="fields">Поля</Tabs.Tab>
							) : null}
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
								<NumberInput
									label="Сортировка"
									value={data.sort ?? 0}
									readOnly={readOnly}
									onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
								/>
								<Switch
									label="Активен"
									checked={Boolean(data.active)}
									disabled={readOnly}
									onChange={(e) => setField('active', e.currentTarget.checked)}
								/>
								<Switch
									label="Обязательное"
									description={
										isPrototype ? 'Все поля прототипа обязательны в каждом значении' : undefined
									}
									checked={Boolean(data.required)}
									disabled={readOnly}
									onChange={(e) => setField('required', e.currentTarget.checked)}
								/>
								<Switch
									label="Множественное"
									checked={Boolean(data.multiple)}
									disabled={readOnly}
									onChange={(e) => setField('multiple', e.currentTarget.checked)}
								/>
								<Select
									label="Тип поля"
									withAsterisk
									data={FIELD_TYPE_OPTIONS}
									value={data.field_type ? data.field_type.toUpperCase() : null}
									error={errors.field_type}
									readOnly={readOnly}
									onChange={(value) => {
										setField('field_type', value ?? 'S');
										if (value !== 'E' && value !== 'G') {
											setField('link_iblock_id', null);
										}
										if (value !== 'F') {
											setField('file_type', '');
										}
										if (value !== 'L' && activeTab === 'enums') {
											setActiveTab('general');
										}
										if (value !== 'P' && activeTab === 'fields') {
											setActiveTab('general');
										}
										if (value === 'L' && (data.list_type ?? '').toUpperCase() !== 'C') {
											setField('list_type', 'L');
										}
									}}
								/>
								{isFileType ? (
									<>
										<Select
											label="Тип файла (пресет)"
											data={FILE_TYPE_PRESETS}
											value={
												FILE_TYPE_PRESETS.some((o) => o.value === (data.file_type ?? ''))
													? (data.file_type ?? '')
													: null
											}
											placeholder={
												data.file_type &&
												!FILE_TYPE_PRESETS.some((o) => o.value === data.file_type)
													? data.file_type
													: 'Выберите или укажите ниже'
											}
											readOnly={readOnly}
											onChange={(value) => setField('file_type', value ?? '')}
											clearable
											searchable
										/>
										<TextInput
											label="Тип файла"
											description="Пусто — любой; image — картинки; расширения jpg,png или mime image/*"
											value={data.file_type ?? ''}
											readOnly={readOnly}
											onChange={(e) => setField('file_type', e.currentTarget.value)}
										/>
									</>
								) : null}
								{needsLinkIblock ? (
									<Select
										label="Инфоблок привязки"
										withAsterisk
										data={blockOptions}
										value={data.link_iblock_id != null ? String(data.link_iblock_id) : null}
										error={errors.link_iblock_id}
										readOnly={readOnly}
										onChange={(value) =>
											setField('link_iblock_id', value ? Number(value) : null)
										}
										searchable
										clearable
									/>
								) : null}
								{isListType ? (
									<Select
										label="Тип списка"
										data={LIST_TYPE_OPTIONS}
										value={normalizeListType(data.list_type)}
										readOnly={readOnly}
										allowDeselect={false}
										onChange={(value) => setField('list_type', value ?? 'L')}
									/>
								) : null}
								<TextInput
									label="Значение по умолчанию"
									value={data.default_value ?? ''}
									readOnly={readOnly}
									onChange={(e) => setField('default_value', e.currentTarget.value)}
								/>
								<TextInput
									label="Префикс"
									value={data.prefix ?? ''}
									readOnly={readOnly}
									onChange={(e) => setField('prefix', e.currentTarget.value)}
								/>
								<TextInput
									label="Постфикс"
									value={data.postfix ?? ''}
									readOnly={readOnly}
									onChange={(e) => setField('postfix', e.currentTarget.value)}
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

						{!isNewRecord && isListType ? (
							<Tabs.Panel value="enums" pt="sm">
								<PropertyEnumsEditor propertyId={entityId} readOnly={readOnly} />
							</Tabs.Panel>
						) : null}
						{!isNewRecord && isPrototype ? (
							<Tabs.Panel value="fields" pt="sm">
								<PrototypeFieldsEditor
									propertyId={data.id}
									blockId={data.block_id}
									readOnly={readOnly}
									blockOptions={blockOptions}
								/>
							</Tabs.Panel>
						) : null}
					</Tabs>
				);
			}}
		</MainEntityForm>
	);
}
