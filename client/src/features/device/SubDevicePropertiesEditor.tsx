import {
	Checkbox,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	Switch,
	TextInput,
} from '@mantine/core';
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
			<Stack gap="xs">
				{entries.map((entry) => (
					<Checkbox
						key={entry.id}
						label={entry.name ?? entry.value ?? String(entry.id)}
						checked={selected.has(String(entry.id))}
						disabled={readOnly}
						onChange={(event) => {
							const next = new Set(selected);
							if (event.currentTarget.checked) {
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
					/>
				))}
			</Stack>
		);
	}

	if (isCheckbox) {
		const selectedId = singleEnumId(item.valueL);
		const checkedEntry = entries.find((entry) => String(entry.id) === selectedId);
		return (
			<Switch
				label={checkedEntry?.name ?? item.name ?? 'Значение'}
				checked={selectedId != null}
				disabled={readOnly}
				onChange={(event) => {
					if (!event.currentTarget.checked) {
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
		);
	}

	if (item.multiple) {
		return (
			<MultiSelect
				label={item.name}
				data={options}
				value={selectedEnumIds(item.valueL)}
				readOnly={readOnly}
				searchable
				onChange={(values) =>
					onChange(
						patchSubDeviceProperty(item, {
							valueL: values.map(Number),
						}),
					)
				}
			/>
		);
	}

	return (
		<Select
			label={item.name}
			data={options}
			value={singleEnumId(item.valueL)}
			readOnly={readOnly}
			searchable
			clearable
			onChange={(value) =>
				onChange(
					patchSubDeviceProperty(item, {
						valueL: value ? Number(value) : null,
					}),
				)
			}
		/>
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
			<NumberInput
				label={label}
				value={
					item.valueN === '' || item.valueN == null
						? undefined
						: Number(item.valueN)
				}
				readOnly={readOnly}
				onChange={(value) =>
					onChange(
						patchSubDeviceProperty(item, {
							valueN: typeof value === 'number' ? value : '',
						}),
					)
				}
			/>
		);
	}

	return (
		<TextInput
			label={label}
			value={item.valueS ?? item.value ?? ''}
			readOnly={readOnly}
			onChange={(event) =>
				onChange(
					patchSubDeviceProperty(item, {
						value: event.currentTarget.value,
					}),
				)
			}
		/>
	);
}

export function SubDevicePropertiesEditor({
	properties,
	readOnly,
	onChange,
}: SubDevicePropertiesEditorProps) {
	const entries = useMemo(() => sortSubDeviceProperties(properties), [properties]);

	if (entries.length === 0) {
		return <TextInput label="Свойства" value="Нет свойств" readOnly disabled />;
	}

	const updateProperty = (key: string, next: SubDevicePropertyValue) => {
		onChange({ ...properties, [key]: next });
	};

	return (
		<Stack gap="sm">
			{entries.map(([key, item]) => (
				<PropertyField
					key={key}
					item={item}
					readOnly={readOnly}
					onChange={(next) => updateProperty(key, next)}
				/>
			))}
		</Stack>
	);
}
