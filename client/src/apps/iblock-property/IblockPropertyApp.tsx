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
	list_type: '',
	default_value: '',
	postfix: '',
	prefix: '',
	active_from: '',
	active_to: '',
	block_id: null,
	parent_id: null,
	link_iblock_id: null,
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
				const needsLinkIblock = fieldType === 'E' || fieldType === 'G';

				return (
					<Tabs value={activeTab} onChange={setActiveTab}>
						<Tabs.List>
							<Tabs.Tab value="general">Общие</Tabs.Tab>
							{!isNewRecord && isListType ? (
								<Tabs.Tab value="enums">Значения списка</Tabs.Tab>
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
										if (value !== 'L' && activeTab === 'enums') {
											setActiveTab('general');
										}
									}}
								/>
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
								<TextInput
									label="Тип списка"
									value={data.list_type ?? ''}
									readOnly={readOnly}
									onChange={(e) => setField('list_type', e.currentTarget.value)}
								/>
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
					</Tabs>
				);
			}}
		</MainEntityForm>
	);
}
