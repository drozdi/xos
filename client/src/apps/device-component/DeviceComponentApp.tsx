import { Alert, NumberInput, Select, Stack, Switch, Tabs, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { deviceComponentApi, deviceTypeApi, type ComponentDetail } from '@/core/api/endpoints/deviceApi';
import { TypePropertiesEditor } from '@/features/device/TypePropertiesEditor';
import {
	canCreateDeviceComponent,
	useCanDeleteDeviceComponent,
	useCanReadDeviceComponent,
	useCanUpdateDeviceComponent,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import type { TypePropertyItem } from '@/features/device/propertyTypes';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceComponentForm } from './deviceComponentValidation';

const initialData: ComponentDetail = {
	id: 0,
	name: '',
	code: '',
	sort: 0,
	active: true,
	property_id: null,
	properties: {},
};

export default function DeviceComponentApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceComponent();
	const canUpdate = useCanUpdateDeviceComponent();
	const canDelete = useCanDeleteDeviceComponent();
	const canCreate = canCreateDeviceComponent();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const propertiesQuery = useQuery({
		queryKey: ['device', 'typeProperties'],
		queryFn: () => deviceTypeApi.properties(),
	});

	const propertyOptions = useMemo(
		() =>
			(propertiesQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.label ?? item.sublabel ?? String(item.value),
			})),
		[propertiesQuery.data],
	);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание типа комплектующих
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типа комплектующих
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Тип комплектующих"
			queryKey={['device', 'component']}
			listQueryKey={['device', 'components']}
			load={deviceComponentApi.get}
			save={deviceComponentApi.update}
			create={deviceComponentApi.create}
			remove={deviceComponentApi.remove}
			initialData={initialData}
			validate={validateDeviceComponentForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="properties">Свойства</Tabs.Tab>
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
								label="Корневое свойство"
								withAsterisk
								data={propertyOptions}
								value={data.property_id ? String(data.property_id) : null}
								error={errors.property_id}
								readOnly={readOnly}
								onChange={(value) => setField('property_id', value ? Number(value) : null)}
								searchable
								clearable
							/>
							<Switch
								label="Активен"
								checked={Boolean(data.active)}
								disabled={readOnly}
								onChange={(e) => setField('active', e.currentTarget.checked)}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="properties" pt="sm">
						<TypePropertiesEditor
							properties={normalizeIdRecord<TypePropertyItem>(data.properties)}
							readOnly={readOnly}
							onChange={(properties) => setField('properties', properties)}
							catalogApi={deviceComponentApi}
							catalogQueryKey="component"
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
