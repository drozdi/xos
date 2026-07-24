import { Alert, Flex, Form, Input, InputNumber, Select, Switch, Tabs } from 'antd';
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
	const [activeTab, setActiveTab] = useState('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание типа комплектующих"
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
				description="Нет прав на просмотр типа комплектующих"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Тип комплектующих"
			queryKey={['device', 'component']}
			listQueryKey={['device', 'components']}
			invalidateQueryKeys={[['device']]}
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
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: 'general',
							label: 'Общие',
							children: (
								<Flex vertical gap={12}>
									<Form.Item label="Активен" style={{ marginBottom: 0 }}>
										<Switch
											checked={Boolean(data.active)}
											disabled={readOnly}
											onChange={(checked) => setField('active', checked)}
										/>
									</Form.Item>
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
									catalogApi={deviceComponentApi}
									catalogQueryKey="component"
								/>
							),
						},
					]}
				/>
			)}
		</MainEntityForm>
	);
}
