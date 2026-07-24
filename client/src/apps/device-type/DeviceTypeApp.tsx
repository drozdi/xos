import { Alert, Flex, Form, Input, InputNumber, Select, Tabs } from 'antd';
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
	const [activeTab, setActiveTab] = useState('general');

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
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание типа"
				style={{ margin: 16 }}
			/>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на просмотр типа"
				style={{ margin: 16 }}
			/>
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
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: 'general',
							label: 'Общие',
							children: (
								<Flex vertical gap={12}>
									<Form.Item
										label="Название"
										required
										validateStatus={errors.name ? 'error' : undefined}
										help={errors.name}
										style={{ marginBottom: 0 }}
									>
										<Input
											value={data.name ?? ''}
											readOnly={readOnly}
											onChange={(e) => setField('name', e.target.value)}
										/>
									</Form.Item>
									<Form.Item
										label="Код"
										required
										validateStatus={errors.code ? 'error' : undefined}
										help={errors.code}
										style={{ marginBottom: 0 }}
									>
										<Input
											value={data.code ?? ''}
											readOnly={readOnly}
											onChange={(e) => setField('code', e.target.value)}
										/>
									</Form.Item>
									<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
										<InputNumber
											value={data.sort ?? 0}
											disabled={readOnly}
											style={{ width: '100%' }}
											onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
										/>
									</Form.Item>
									<Form.Item label="Родитель" style={{ marginBottom: 0 }}>
										<Select
											options={parentOptions}
											value={data.parent_id ? String(data.parent_id) : undefined}
											disabled={readOnly}
											onChange={(value) => setField('parent_id', value ? Number(value) : null)}
											showSearch
											allowClear
										/>
									</Form.Item>
								</Flex>
							),
						},
						{
							key: 'properties',
							label: 'Свойства',
							children: (
								<TypePropertiesEditor
									properties={normalizeIdRecord<TypePropertyItem>(data.properties)}
									readOnly={readOnly}
									onChange={(properties) => setField('properties', properties)}
									catalogApi={deviceTypeApi}
									catalogQueryKey="type"
								/>
							),
						},
						{
							key: 'components',
							label: 'Типы комплектующих',
							children: (
								<Form.Item label="Типы комплектующих" style={{ marginBottom: 0 }}>
									<Select
										mode="multiple"
										options={componentOptions}
										value={(data.components ?? []).map(String)}
										disabled={readOnly}
										onChange={(values) => setField('components', values.map(Number))}
										showSearch
										allowClear
									/>
								</Form.Item>
							),
						},
					]}
				/>
			)}
		</MainEntityForm>
	);
}
