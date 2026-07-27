import { Alert, MultiSelect, NumberInput, Select, Stack, Tabs, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { deviceTypeApi, type TypeDetail } from '@/core/api/endpoints/deviceApi';
import { TypePropertiesEditor } from '@/features/device/TypePropertiesEditor';
import {
	canCreateDeviceType,
	useCanDeleteDeviceType,
	useCanReadDeviceType,
	useCanUpdateDeviceType,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import type { TypePropertyItem } from '@/features/device/propertyTypes';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceTypeForm } from './deviceTypeValidation';

const initialData: TypeDetail = {
	id: 0,
	name: '',
	code: '',
	sort: 0,
	parent_id: null,
	components: [],
	properties: {},
};

type SelectOption = { value: string; label: string };

function uniqueSelectOptions(
	items: Array<{ value?: number | string; label?: string; sublabel?: string; children?: unknown[] }>,
	excludeId?: number,
): SelectOption[] {
	const map = new Map<string, string>();

	const visit = (item: {
		value?: number | string;
		label?: string;
		sublabel?: string;
		children?: unknown[];
	}) => {
		if (item.value == null) {
			return;
		}
		const value = String(item.value);
		if (excludeId != null && value === String(excludeId)) {
			return;
		}
		if (!map.has(value)) {
			map.set(value, item.label ?? item.sublabel ?? value);
		}
		for (const child of item.children ?? []) {
			if (typeof child === 'object' && child != null) {
				visit(child as { value?: number | string; label?: string; sublabel?: string; children?: unknown[] });
			}
		}
	};

	for (const item of items) {
		visit(item);
	}

	return Array.from(map, ([value, label]) => ({ value, label }));
}

export default function DeviceTypeApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceType();
	const canUpdate = useCanUpdateDeviceType();
	const canDelete = useCanDeleteDeviceType();
	const canCreate = canCreateDeviceType();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const listQuery = useQuery({
		queryKey: ['device', 'types', 'select'],
		queryFn: () => deviceTypeApi.select(),
	});

	const componentsQuery = useQuery({
		queryKey: ['device', 'typeComponents'],
		queryFn: () => deviceTypeApi.components(),
	});

	const parentOptions = useMemo(
		() => uniqueSelectOptions(listQuery.data ?? [], entityId || undefined),
		[listQuery.data, entityId],
	);

	const componentOptions = useMemo(
		() => uniqueSelectOptions(componentsQuery.data ?? []),
		[componentsQuery.data],
	);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание типа
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типа
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Тип устройства"
			queryKey={['device', 'type']}
			listQueryKey={['device', 'types']}
			invalidateQueryKeys={[['device']]}
			load={deviceTypeApi.get}
			save={deviceTypeApi.update}
			create={deviceTypeApi.create}
			remove={deviceTypeApi.remove}
			initialData={initialData}
			validate={validateDeviceTypeForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="properties">Свойства</Tabs.Tab>
						<Tabs.Tab value="components">Типы комплектующих</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="general" pt="sm">
						<Stack gap="sm">
							<TextInput
								label="Название"
								withAsterisk
								value={data.name ?? ''}
								error={errors.name}
								readOnly={readOnly}
								onChange={(e) => setField('name', e.currentTarget.value)}
							/>
							<TextInput
								label="Код"
								withAsterisk
								value={data.code ?? ''}
								error={errors.code}
								readOnly={readOnly}
								onChange={(e) => setField('code', e.currentTarget.value)}
							/>
							<NumberInput
								label="Сортировка"
								value={data.sort ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
							/>
							<Select
								label="Родитель"
								data={parentOptions}
								value={data.parent_id ? String(data.parent_id) : null}
								readOnly={readOnly}
								onChange={(value) => setField('parent_id', value ? Number(value) : null)}
								searchable
								clearable
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="properties" pt="sm">
						<TypePropertiesEditor
							properties={normalizeIdRecord<TypePropertyItem>(data.properties)}
							readOnly={readOnly}
							onChange={(properties) => setField('properties', properties)}
							catalogApi={deviceTypeApi}
							catalogQueryKey="type"
						/>
					</Tabs.Panel>

					<Tabs.Panel value="components" pt="sm">
						<MultiSelect
							label="Типы комплектующих"
							data={componentOptions}
							value={(data.components ?? []).map(String)}
							disabled={readOnly}
							onChange={(values) => setField('components', values.map(Number))}
							searchable
							clearable
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
