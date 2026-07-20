import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Modal,
	NumberInput,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconList, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { PropertyDetail } from '@/core/api/endpoints/deviceApi';
import { useWindowSize } from '@/core/windowManager';
import { nextTempId, normalizeIdRecord } from '@/features/device/deviceAppUtils';
import { PropertyEnumsEditor } from '@/features/device/PropertyEnumsEditor';
import { FIELD_TYPE_OPTIONS, LIST_TYPE_OPTIONS } from '@/features/device/propertyFieldOptions';
import { normalizeEnumRecord } from '@/features/device/propertyEnumUtils';
import {
	buildPropertyCatalogSelectData,
	createTypePropertyFromTemplate,
	type PropertyCatalogOption,
} from '@/features/device/propertyTemplateUtils';
import type { PropertyEnumItem, TypePropertyItem } from '@/features/device/propertyTypes';

type PropertyCatalogApi = {
	propertyCatalog: () => Promise<PropertyCatalogOption[]>;
	propertyTemplate: (id: number) => Promise<PropertyDetail>;
};

interface TypePropertiesEditorProps {
	properties: Record<string, TypePropertyItem>;
	readOnly: boolean;
	onChange: (properties: Record<string, TypePropertyItem>) => void;
	catalogApi: PropertyCatalogApi;
	catalogQueryKey?: string;
}

function useTableLayout(windowWidth: number, tableMinWidth: number): boolean {
	return windowWidth >= tableMinWidth;
}

function createPropertyItem(sort: number): TypePropertyItem {
	return {
		id: 0,
		active: true,
		required: false,
		multiple: false,
		code: '',
		name: '',
		postfix: '',
		fieldType: 'S',
		listType: 'S',
		defaultValue: '',
		sort,
		enums: {},
	};
}

function sortPropertyEntries(properties: Record<string, TypePropertyItem>) {
	return Object.entries(properties ?? {}).sort(([, a], [, b]) => (a.sort ?? 0) - (b.sort ?? 0));
}

interface PropertyRowProps {
	entryKey: string;
	item: TypePropertyItem;
	readOnly: boolean;
	layout: 'table' | 'card';
	onFieldChange: (key: string, patch: Partial<TypePropertyItem>) => void;
	onRemove: (key: string) => void;
	onOpenEnums: (key: string) => void;
}

function PropertyRowFields({
	item,
	entryKey,
	readOnly,
	layout,
	onFieldChange,
	onRemove,
	onOpenEnums,
}: PropertyRowProps) {
	const fromTemplate = Boolean(item.prototype_id);
	const isList = item.fieldType === 'L';
	const isNumber = item.fieldType === 'N';
	const withLabels = layout === 'card';

	const checkboxes = (
		<Stack gap={4}>
			<Checkbox
				label="Активный"
				checked={Boolean(item.active)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { active: e.currentTarget.checked })}
			/>
			<Checkbox
				label="Обязательный"
				checked={Boolean(item.required)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { required: e.currentTarget.checked })}
			/>
			<Checkbox
				label="Множественное"
				checked={Boolean(item.multiple)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { multiple: e.currentTarget.checked })}
			/>
		</Stack>
	);

	const prototypeHint = fromTemplate ? (
		<Text size="xs" c="dimmed">
			Шаблон #{item.prototype_id}
		</Text>
	) : null;

	const codeField = (
		<TextInput
			label={withLabels ? 'Код' : undefined}
			value={item.code ?? ''}
			readOnly={readOnly}
			onChange={(e) => onFieldChange(entryKey, { code: e.currentTarget.value })}
		/>
	);

	const nameField = (
		<Stack gap={2}>
			<TextInput
				label={withLabels ? 'Название' : undefined}
				value={item.name ?? ''}
				readOnly={readOnly}
				onChange={(e) => onFieldChange(entryKey, { name: e.currentTarget.value })}
			/>
			{prototypeHint}
		</Stack>
	);

	const postfixField = (
		<TextInput
			label={withLabels ? 'Ед. изм.' : undefined}
			value={item.postfix ?? ''}
			readOnly={readOnly || fromTemplate}
			onChange={(e) => onFieldChange(entryKey, { postfix: e.currentTarget.value })}
		/>
	);

	const fieldTypeSelect = (
		<Select
			label={withLabels ? 'Тип поля' : undefined}
			data={[...FIELD_TYPE_OPTIONS]}
			value={item.fieldType ?? 'S'}
			readOnly={readOnly || fromTemplate}
			allowDeselect={false}
			onChange={(value) => {
				const fieldType = value ?? 'S';
				const patch: Partial<TypePropertyItem> = { fieldType };
				if (fieldType === 'L') {
					patch.listType = item.listType || 'S';
				} else {
					patch.listType = '';
				}
				onFieldChange(entryKey, patch);
			}}
		/>
	);

	const listTypeSelect = isList ? (
		<Select
			label={withLabels ? 'Тип списка' : undefined}
			data={[...LIST_TYPE_OPTIONS]}
			value={item.listType ?? 'S'}
			readOnly={readOnly || fromTemplate}
			allowDeselect={false}
			onChange={(value) => onFieldChange(entryKey, { listType: value ?? 'S' })}
		/>
	) : null;

	const defaultField = !isList ? (
		isNumber ? (
			<NumberInput
				label={withLabels ? 'Значение по умолчанию' : undefined}
				value={item.defaultValue != null && item.defaultValue !== '' ? Number(item.defaultValue) : ''}
				readOnly={readOnly}
				onChange={(value) =>
					onFieldChange(entryKey, {
						defaultValue: typeof value === 'number' ? value : '',
					})
				}
			/>
		) : (
			<TextInput
				label={withLabels ? 'Значение по умолчанию' : undefined}
				value={String(item.defaultValue ?? '')}
				readOnly={readOnly}
				onChange={(e) => onFieldChange(entryKey, { defaultValue: e.currentTarget.value })}
			/>
		)
	) : (
		<Button
			variant="light"
			size="xs"
			leftSection={<IconList size={14} />}
			disabled={readOnly && Object.keys(normalizeEnumRecord(item.enums)).length === 0}
			onClick={() => onOpenEnums(entryKey)}
		>
			{fromTemplate ? 'Значения по шаблону' : 'Значения списка'}
		</Button>
	);

	const extraFieldColumn = isList ? (
		<Stack gap="xs">
			{listTypeSelect}
			{defaultField}
		</Stack>
	) : (
		defaultField
	);

	const removeButton = !readOnly ? (
		<ActionIcon color="red" variant="light" aria-label="Удалить" onClick={() => onRemove(entryKey)}>
			<IconTrash size={16} />
		</ActionIcon>
	) : null;

	if (layout === 'table') {
		return (
			<Table.Tr>
				<Table.Td>{checkboxes}</Table.Td>
				<Table.Td>{codeField}</Table.Td>
				<Table.Td>{nameField}</Table.Td>
				<Table.Td>{postfixField}</Table.Td>
				<Table.Td>{fieldTypeSelect}</Table.Td>
				<Table.Td>{extraFieldColumn}</Table.Td>
				{!readOnly ? <Table.Td w={48}>{removeButton}</Table.Td> : null}
			</Table.Tr>
		);
	}

	return (
		<Paper withBorder p="sm">
			<Group justify="space-between" align="flex-start" mb="xs">
				<Text fw={500} size="sm">
					{item.name || item.code || 'Свойство'}
				</Text>
				{removeButton}
			</Group>
			<Stack gap="xs">
				{checkboxes}
				{codeField}
				{nameField}
				{postfixField}
				{fieldTypeSelect}
				{listTypeSelect}
				{defaultField}
			</Stack>
		</Paper>
	);
}

export function TypePropertiesEditor({
	properties,
	readOnly,
	onChange,
	catalogApi,
	catalogQueryKey = 'type',
}: TypePropertiesEditorProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = useTableLayout(windowWidth, 960);
	const [enumsEditorKey, setEnumsEditorKey] = useState<string | null>(null);
	const [catalogOpened, setCatalogOpened] = useState(false);
	const [catalogValue, setCatalogValue] = useState<string | null>(null);
	const [catalogLoading, setCatalogLoading] = useState(false);

	const catalogQuery = useQuery({
		queryKey: ['device', 'propertyCatalog', catalogQueryKey],
		queryFn: () => catalogApi.propertyCatalog(),
		enabled: catalogOpened,
	});

	const records = useMemo(() => normalizeIdRecord<TypePropertyItem>(properties), [properties]);
	const entries = useMemo(() => sortPropertyEntries(records), [records]);
	const enumsProperty = enumsEditorKey ? records[enumsEditorKey] : undefined;
	const catalogSelectData = useMemo(
		() => buildPropertyCatalogSelectData(catalogQuery.data ?? []),
		[catalogQuery.data],
	);

	const updateProperty = (key: string, patch: Partial<TypePropertyItem>) => {
		const current = records[key];
		if (!current) {
			return;
		}
		onChange({
			...records,
			[key]: {
				...current,
				...patch,
			},
		});
	};

	const removeProperty = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addProperty = () => {
		const nextSort = (entries.at(-1)?.[1].sort ?? 0) + 10;
		const key = nextTempId();
		onChange({ ...records, [key]: createPropertyItem(nextSort) });
	};

	const addFromCatalog = async () => {
		if (!catalogValue) {
			return;
		}
		setCatalogLoading(true);
		try {
			const template = await catalogApi.propertyTemplate(Number(catalogValue));
			const nextSort = (entries.at(-1)?.[1].sort ?? 0) + 10;
			const key = nextTempId();
			onChange({
				...records,
				[key]: createTypePropertyFromTemplate(template, nextSort),
			});
			setCatalogOpened(false);
			setCatalogValue(null);
		} finally {
			setCatalogLoading(false);
		}
	};

	const handleEnumsChange = (enums: Record<string, PropertyEnumItem>, defaultValue: string) => {
		if (!enumsEditorKey) {
			return;
		}
		updateProperty(enumsEditorKey, { enums, defaultValue });
	};

	const enumsTitle = enumsProperty?.prototype_id
		? `Значения по шаблону #${enumsProperty.prototype_id}${enumsProperty.name ? `: ${enumsProperty.name}` : ''}`
		: enumsProperty?.name
			? `Значения: ${enumsProperty.name}`
			: 'Значения списка';

	return (
		<Stack gap="sm">
			<Group justify="space-between">
				<strong>Свойства</strong>
				{!readOnly ? (
					<Group gap="xs">
						<Button size="xs" variant="default" onClick={() => setCatalogOpened(true)}>
							Из справочника
						</Button>
						<Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addProperty}>
							Новое
						</Button>
					</Group>
				) : null}
			</Group>

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет свойств
				</Text>
			) : isTableLayout ? (
				<Table highlightOnHover withTableBorder withColumnBorders horizontalSpacing="xs">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Флаги</Table.Th>
							<Table.Th>Код</Table.Th>
							<Table.Th>Название</Table.Th>
							<Table.Th>Ед. изм.</Table.Th>
							<Table.Th>Тип поля</Table.Th>
							<Table.Th>По умолчанию / значения</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => (
							<PropertyRowFields
								key={key}
								entryKey={key}
								item={item}
								readOnly={readOnly}
								layout="table"
								onFieldChange={updateProperty}
								onRemove={removeProperty}
								onOpenEnums={setEnumsEditorKey}
							/>
						))}
					</Table.Tbody>
				</Table>
			) : (
				entries.map(([key, item]) => (
					<PropertyRowFields
						key={key}
						entryKey={key}
						item={item}
						readOnly={readOnly}
						layout="card"
						onFieldChange={updateProperty}
						onRemove={removeProperty}
						onOpenEnums={setEnumsEditorKey}
					/>
				))
			)}

			<PropertyEnumsEditor
				opened={enumsEditorKey != null}
				title={enumsTitle}
				enums={normalizeEnumRecord(enumsProperty?.enums)}
				readOnly={readOnly}
				onClose={() => setEnumsEditorKey(null)}
				onChange={handleEnumsChange}
			/>

			<Modal
				opened={catalogOpened}
				onClose={() => {
					setCatalogOpened(false);
					setCatalogValue(null);
				}}
				title="Добавить из справочника"
				centered
			>
				<Stack gap="sm">
					<Select
						label="Свойство"
						placeholder="Выберите свойство"
						data={catalogSelectData}
						value={catalogValue}
						onChange={setCatalogValue}
						searchable
						nothingFoundMessage={catalogQuery.isLoading ? 'Загрузка…' : 'Нет свойств'}
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setCatalogOpened(false)}>
							Отмена
						</Button>
						<Button loading={catalogLoading} disabled={!catalogValue} onClick={() => void addFromCatalog()}>
							Добавить
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
