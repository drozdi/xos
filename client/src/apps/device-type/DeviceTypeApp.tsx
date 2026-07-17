import { Alert, MultiSelect, NumberInput, Select, Stack, Tabs, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { deviceTypeApi, type TypeDetail } from '@/core/api/endpoints/deviceApi';
import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import {
	canCreateDeviceType,
	useCanDeleteDeviceType,
	useCanReadDeviceType,
	useCanUpdateDeviceType,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
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
		queryFn: () => deviceTypeApi.list({ limit: -1, offset: 1 }),
	});

	const componentsQuery = useQuery({
		queryKey: ['device', 'typeComponents'],
		queryFn: () => deviceTypeApi.components(),
	});

	const parentOptions = useMemo(
		() =>
			(listQuery.data?.items ?? [])
				.filter((item) => item.id !== entityId)
				.map((item) => ({ value: String(item.id), label: item.name || item.code })),
		[listQuery.data?.items, entityId],
	);

	const componentOptions = useMemo(
		() =>
			(componentsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.label ?? String(item.value),
			})),
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
						<Tabs.Tab value="components">Компоненты</Tabs.Tab>
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
						<RecordCollectionEditor
							title="Свойства"
							records={normalizeIdRecord(data.properties)}
							readOnly={readOnly}
							columns={[
								{ key: 'name', label: 'Название' },
								{ key: 'code', label: 'Код' },
								{ key: 'fieldType', label: 'Тип поля' },
								{ key: 'listType', label: 'Тип списка' },
								{ key: 'sort', label: 'Сортировка' },
							]}
							onChange={(properties) => setField('properties', properties)}
							createItem={() => ({
								id: 0,
								name: '',
								code: '',
								fieldType: '',
								listType: '',
								sort: 0,
							})}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="components" pt="sm">
						<MultiSelect
							label="Компоненты"
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
