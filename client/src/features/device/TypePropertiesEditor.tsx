import {
	Button,
	Card,
	Checkbox,
	Flex,
	Form,
	Input,
	InputNumber,
	Modal,
	Select,
	Table,
	Typography,
} from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
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
	const fromTemplate = Boolean(item.prototype_id ?? item.property_id);
	const isList = item.fieldType === 'L';
	const isNumber = item.fieldType === 'N';
	const withLabels = layout === 'card';

	const checkboxes = (
		<Flex vertical gap={4}>
			<Checkbox
				checked={Boolean(item.active)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { active: e.target.checked })}
			>
				Активный
			</Checkbox>
			<Checkbox
				checked={Boolean(item.required)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { required: e.target.checked })}
			>
				Обязательный
			</Checkbox>
			<Checkbox
				checked={Boolean(item.multiple)}
				disabled={readOnly}
				onChange={(e) => onFieldChange(entryKey, { multiple: e.target.checked })}
			>
				Множественное
			</Checkbox>
		</Flex>
	);

	const prototypeHint = fromTemplate ? (
		<Typography.Text type="secondary" style={{ fontSize: 12 }}>
			Шаблон #{item.prototype_id ?? item.property_id}
		</Typography.Text>
	) : null;

	const codeField = withLabels ? (
		<Form.Item label="Код" style={{ marginBottom: 0 }}>
			<Input
				value={item.code ?? ''}
				readOnly={readOnly}
				onChange={(e) => onFieldChange(entryKey, { code: e.target.value })}
			/>
		</Form.Item>
	) : (
		<Input
			value={item.code ?? ''}
			readOnly={readOnly}
			onChange={(e) => onFieldChange(entryKey, { code: e.target.value })}
		/>
	);

	const nameField = withLabels ? (
		<Flex vertical gap={2}>
			<Form.Item label="Название" style={{ marginBottom: 0 }}>
				<Input
					value={item.name ?? ''}
					readOnly={readOnly}
					onChange={(e) => onFieldChange(entryKey, { name: e.target.value })}
				/>
			</Form.Item>
			{prototypeHint}
		</Flex>
	) : (
		<Flex vertical gap={2}>
			<Input
				value={item.name ?? ''}
				readOnly={readOnly}
				onChange={(e) => onFieldChange(entryKey, { name: e.target.value })}
			/>
			{prototypeHint}
		</Flex>
	);

	const postfixField = withLabels ? (
		<Form.Item label="Ед. изм." style={{ marginBottom: 0 }}>
			<Input
				value={item.postfix ?? ''}
				readOnly={readOnly || fromTemplate}
				onChange={(e) => onFieldChange(entryKey, { postfix: e.target.value })}
			/>
		</Form.Item>
	) : (
		<Input
			value={item.postfix ?? ''}
			readOnly={readOnly || fromTemplate}
			onChange={(e) => onFieldChange(entryKey, { postfix: e.target.value })}
		/>
	);

	const fieldTypeSelect = withLabels ? (
		<Form.Item label="Тип поля" style={{ marginBottom: 0 }}>
			<Select
				options={[...FIELD_TYPE_OPTIONS]}
				value={item.fieldType ?? 'S'}
				disabled={readOnly || fromTemplate}
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
		</Form.Item>
	) : (
		<Select
			options={[...FIELD_TYPE_OPTIONS]}
			value={item.fieldType ?? 'S'}
			disabled={readOnly || fromTemplate}
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
		withLabels ? (
			<Form.Item label="Тип списка" style={{ marginBottom: 0 }}>
				<Select
					options={[...LIST_TYPE_OPTIONS]}
					value={item.listType ?? 'S'}
					disabled={readOnly || fromTemplate}
					onChange={(value) => onFieldChange(entryKey, { listType: value ?? 'S' })}
				/>
			</Form.Item>
		) : (
			<Select
				options={[...LIST_TYPE_OPTIONS]}
				value={item.listType ?? 'S'}
				disabled={readOnly || fromTemplate}
				onChange={(value) => onFieldChange(entryKey, { listType: value ?? 'S' })}
			/>
		)
	) : null;

	const defaultField = !isList ? (
		isNumber ? (
			withLabels ? (
				<Form.Item label="Значение по умолчанию" style={{ marginBottom: 0 }}>
					<InputNumber
						value={item.defaultValue != null && item.defaultValue !== '' ? Number(item.defaultValue) : undefined}
						disabled={readOnly}
						style={{ width: '100%' }}
						onChange={(value) =>
							onFieldChange(entryKey, {
								defaultValue: typeof value === 'number' ? value : '',
							})
						}
					/>
				</Form.Item>
			) : (
				<InputNumber
					value={item.defaultValue != null && item.defaultValue !== '' ? Number(item.defaultValue) : undefined}
					disabled={readOnly}
					style={{ width: '100%' }}
					onChange={(value) =>
						onFieldChange(entryKey, {
							defaultValue: typeof value === 'number' ? value : '',
						})
					}
				/>
			)
		) : withLabels ? (
			<Form.Item label="Значение по умолчанию" style={{ marginBottom: 0 }}>
				<Input
					value={String(item.defaultValue ?? '')}
					readOnly={readOnly}
					onChange={(e) => onFieldChange(entryKey, { defaultValue: e.target.value })}
				/>
			</Form.Item>
		) : (
			<Input
				value={String(item.defaultValue ?? '')}
				readOnly={readOnly}
				onChange={(e) => onFieldChange(entryKey, { defaultValue: e.target.value })}
			/>
		)
	) : (
		<Button
			size="small"
			icon={<IconList size={14} />}
			disabled={readOnly && Object.keys(normalizeEnumRecord(item.enums)).length === 0}
			onClick={() => onOpenEnums(entryKey)}
		>
			{fromTemplate ? 'Значения по шаблону' : 'Значения списка'}
		</Button>
	);

	const extraFieldColumn = isList ? (
		<Flex vertical gap={8}>
			{listTypeSelect}
			{defaultField}
		</Flex>
	) : (
		defaultField
	);

	const removeButton = !readOnly ? (
		<Button
			type="text"
			danger
			aria-label="Удалить"
			icon={<IconTrash size={16} />}
			onClick={() => onRemove(entryKey)}
		/>
	) : null;

	if (layout === 'table') {
		return (
			<>
				<td>{checkboxes}</td>
				<td>{codeField}</td>
				<td>{nameField}</td>
				<td>{postfixField}</td>
				<td>{fieldTypeSelect}</td>
				<td>{extraFieldColumn}</td>
				{!readOnly ? <td style={{ width: 48 }}>{removeButton}</td> : null}
			</>
		);
	}

	return (
		<Card size="small">
			<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
				<Typography.Text strong style={{ fontSize: 14 }}>
					{item.name || item.code || 'Свойство'}
				</Typography.Text>
				{removeButton}
			</Flex>
			<Flex vertical gap={8}>
				{checkboxes}
				{codeField}
				{nameField}
				{postfixField}
				{fieldTypeSelect}
				{listTypeSelect}
				{defaultField}
			</Flex>
		</Card>
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

	const enumsTitle = (enumsProperty?.prototype_id ?? enumsProperty?.property_id)
		? `Значения по шаблону #${enumsProperty.prototype_id ?? enumsProperty.property_id}${enumsProperty.name ? `: ${enumsProperty.name}` : ''}`
		: enumsProperty?.name
			? `Значения: ${enumsProperty.name}`
			: 'Значения списка';

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<strong>Свойства</strong>
				{!readOnly ? (
					<Flex gap={8}>
						<Button size="small" onClick={() => setCatalogOpened(true)}>
							Из справочника
						</Button>
						<Button size="small" icon={<IconPlus size={14} />} onClick={addProperty}>
							Новое
						</Button>
					</Flex>
				) : null}
			</Flex>

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет свойств</Typography.Text>
			) : isTableLayout ? (
				<table className="ant-table ant-table-bordered" style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead className="ant-table-thead">
						<tr>
							<th>Флаги</th>
							<th>Код</th>
							<th>Название</th>
							<th>Ед. изм.</th>
							<th>Тип поля</th>
							<th>По умолчанию / значения</th>
							{!readOnly ? <th style={{ width: 48 }} aria-label="Действия" /> : null}
						</tr>
					</thead>
					<tbody className="ant-table-tbody">
						{entries.map(([key, item]) => (
							<tr key={key}>
								<PropertyRowFields
									entryKey={key}
									item={item}
									readOnly={readOnly}
									layout="table"
									onFieldChange={updateProperty}
									onRemove={removeProperty}
									onOpenEnums={setEnumsEditorKey}
								/>
							</tr>
						))}
					</tbody>
				</table>
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
				open={catalogOpened}
				onCancel={() => {
					setCatalogOpened(false);
					setCatalogValue(null);
				}}
				title="Добавить из справочника"
				centered
				footer={[
					<Button
						key="cancel"
						onClick={() => {
							setCatalogOpened(false);
							setCatalogValue(null);
						}}
					>
						Отмена
					</Button>,
					<Button
						key="submit"
						type="primary"
						loading={catalogLoading}
						disabled={!catalogValue}
						onClick={() => void addFromCatalog()}
					>
						Добавить
					</Button>,
				]}
			>
				<Form.Item label="Свойство" style={{ marginBottom: 0 }}>
					<Select
						placeholder="Выберите свойство"
						options={catalogSelectData as DefaultOptionType[]}
						value={catalogValue}
						onChange={setCatalogValue}
						showSearch
						notFoundContent={catalogQuery.isLoading ? 'Загрузка…' : 'Нет свойств'}
					/>
				</Form.Item>
			</Modal>
		</Flex>
	);
}
