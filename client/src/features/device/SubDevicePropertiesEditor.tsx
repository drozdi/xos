import { Checkbox, Flex, Form, Input, InputNumber, Select, Switch } from 'antd';
import { useMemo } from 'react';

import type { PropertyEnumItem } from '@/features/device/propertyTypes';
import {
	patchSubDeviceProperty,
	sortSubDeviceProperties,
	type SubDevicePropertyValue,
} from '@/features/device/subDevicePropertyUtils';

interface SubDevicePropertiesEditorProps {
	properties: Record<string, SubDevicePropertyValue>;
	readOnly: boolean;
	onChange: (properties: Record<string, SubDevicePropertyValue>) => void;
}

function enumOptions(enums: Record<string, PropertyEnumItem> | undefined) {
	return Object.values(enums ?? {})
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((item) => ({
			value: String(item.id),
			label: item.name ?? item.value ?? String(item.id),
		}));
}

function enumEntries(enums: Record<string, PropertyEnumItem> | undefined) {
	return Object.values(enums ?? {}).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function selectedEnumIds(valueL: SubDevicePropertyValue['valueL']): string[] {
	if (Array.isArray(valueL)) {
		return valueL.map(String);
	}
	return valueL != null ? [String(valueL)] : [];
}

function singleEnumId(valueL: SubDevicePropertyValue['valueL']): string | null {
	if (Array.isArray(valueL)) {
		return valueL[0] != null ? String(valueL[0]) : null;
	}
	return valueL != null ? String(valueL) : null;
}

interface PropertyFieldProps {
	item: SubDevicePropertyValue;
	readOnly: boolean;
	onChange: (next: SubDevicePropertyValue) => void;
}

function ListPropertyField({ item, readOnly, onChange }: PropertyFieldProps) {
	const options = useMemo(() => enumOptions(item.enums), [item.enums]);
	const entries = useMemo(() => enumEntries(item.enums), [item.enums]);
	const isCheckbox = (item.listType ?? 'S').toUpperCase() === 'C';

	if (isCheckbox && item.multiple) {
		const selected = new Set(selectedEnumIds(item.valueL));
		return (
			<Flex vertical gap={8}>
				{entries.map((entry) => (
					<Checkbox
						key={entry.id}
						checked={selected.has(String(entry.id))}
						disabled={readOnly}
						onChange={(event) => {
							const next = new Set(selected);
							if (event.target.checked) {
								next.add(String(entry.id));
							} else {
								next.delete(String(entry.id));
							}
							onChange(
								patchSubDeviceProperty(item, {
									valueL: [...next].map(Number),
								}),
							);
						}}
					>
						{entry.name ?? entry.value ?? String(entry.id)}
					</Checkbox>
				))}
			</Flex>
		);
	}

	if (isCheckbox) {
		const selectedId = singleEnumId(item.valueL);
		const checkedEntry = entries.find((entry) => String(entry.id) === selectedId);
		return (
			<Form.Item label={checkedEntry?.name ?? item.name ?? 'Значение'} style={{ marginBottom: 0 }}>
				<Switch
					checked={selectedId != null}
					disabled={readOnly}
					onChange={(checked) => {
						if (!checked) {
							onChange(patchSubDeviceProperty(item, { valueL: null }));
							return;
						}
						const defaultEntry =
							entries.find((entry) => entry.default) ?? entries[0];
						onChange(
							patchSubDeviceProperty(item, {
								valueL: defaultEntry ? defaultEntry.id : null,
							}),
						);
					}}
				/>
			</Form.Item>
		);
	}

	if (item.multiple) {
		return (
			<Form.Item label={item.name} style={{ marginBottom: 0 }}>
				<Select
					mode="multiple"
					options={options}
					value={selectedEnumIds(item.valueL)}
					disabled={readOnly}
					showSearch
					onChange={(values) =>
						onChange(
							patchSubDeviceProperty(item, {
								valueL: values.map(Number),
							}),
						)
					}
				/>
			</Form.Item>
		);
	}

	return (
		<Form.Item label={item.name} style={{ marginBottom: 0 }}>
			<Select
				options={options}
				value={singleEnumId(item.valueL)}
				disabled={readOnly}
				showSearch
				allowClear
				onChange={(value) =>
					onChange(
						patchSubDeviceProperty(item, {
							valueL: value ? Number(value) : null,
						}),
					)
				}
			/>
		</Form.Item>
	);
}

function PropertyField({ item, readOnly, onChange }: PropertyFieldProps) {
	const fieldType = (item.fieldType ?? 'S').toUpperCase();
	const label = item.postfix ? `${item.name ?? ''} (${item.postfix})` : item.name;

	if (fieldType === 'L') {
		return <ListPropertyField item={item} readOnly={readOnly} onChange={onChange} />;
	}

	if (fieldType === 'N') {
		return (
			<Form.Item label={label} style={{ marginBottom: 0 }}>
				<InputNumber
					value={
						item.valueN === '' || item.valueN == null
							? undefined
							: Number(item.valueN)
					}
					disabled={readOnly}
					style={{ width: '100%' }}
					onChange={(value) =>
						onChange(
							patchSubDeviceProperty(item, {
								valueN: typeof value === 'number' ? value : '',
							}),
						)
					}
				/>
			</Form.Item>
		);
	}

	return (
		<Form.Item label={label} style={{ marginBottom: 0 }}>
			<Input
				value={item.valueS ?? item.value ?? ''}
				readOnly={readOnly}
				onChange={(event) =>
					onChange(
						patchSubDeviceProperty(item, {
							value: event.target.value,
						}),
					)
				}
			/>
		</Form.Item>
	);
}

export function SubDevicePropertiesEditor({
	properties,
	readOnly,
	onChange,
}: SubDevicePropertiesEditorProps) {
	const entries = useMemo(() => sortSubDeviceProperties(properties), [properties]);

	if (entries.length === 0) {
		return (
			<Form.Item label="Свойства" style={{ marginBottom: 0 }}>
				<Input value="Нет свойств" readOnly disabled />
			</Form.Item>
		);
	}

	const updateProperty = (key: string, next: SubDevicePropertyValue) => {
		onChange({ ...properties, [key]: next });
	};

	return (
		<Flex vertical gap={12}>
			{entries.map(([key, item]) => (
				<PropertyField
					key={key}
					item={item}
					readOnly={readOnly}
					onChange={(next) => updateProperty(key, next)}
				/>
			))}
		</Flex>
	);
}
