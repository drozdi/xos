import { Alert, Flex, Form, Input, InputNumber, Select, Switch, Tabs } from 'antd';
import { useState } from 'react';

import { devicePropertyApi, type PropertyDetail } from '@/core/api/endpoints/deviceApi';
import { PropertyEnumsEditor } from '@/features/device/PropertyEnumsEditor';
import { PropertyLinksEditor } from '@/features/device/PropertyLinksEditor';
import { normalizeEnumRecord } from '@/features/device/propertyEnumUtils';
import type { PropertyLinkItem } from '@/features/device/propertyTypes';
import {
	canCreateDeviceProperty,
	useCanDeleteDeviceProperty,
	useCanReadDeviceProperty,
	useCanUpdateDeviceProperty,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId, useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDevicePropertyForm } from './devicePropertyValidation';

const initialData: PropertyDetail = {
	id: 0,
	name: '',
	code: '',
	sort: 0,
	fieldType: '',
	listType: '',
	active: true,
	required: false,
	multiple: false,
	postfix: '',
	defaultValue: '',
	enums: {},
	links: {},
};

export default function DevicePropertyApp() {
	const entityId = useEntityId();
	const launchApp = useLaunchDeviceApp();
	const canRead = useCanReadDeviceProperty();
	const canUpdate = useCanUpdateDeviceProperty();
	const canDelete = useCanDeleteDeviceProperty();
	const canCreate = canCreateDeviceProperty();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание свойства"
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
				description="Нет прав на просмотр свойства"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Свойство"
			queryKey={['device', 'property']}
			listQueryKey={['device', 'properties']}
			invalidateQueryKeys={[['device']]}
			load={devicePropertyApi.get}
			save={devicePropertyApi.update}
			create={devicePropertyApi.create}
			remove={devicePropertyApi.remove}
			initialData={initialData}
			validate={validateDevicePropertyForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => {
				const items = [
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
								<Form.Item label="Тип поля" style={{ marginBottom: 0 }}>
									<Input
										value={data.fieldType ?? ''}
										readOnly={readOnly}
										onChange={(e) => setField('fieldType', e.target.value)}
									/>
								</Form.Item>
								<Form.Item label="Тип списка" style={{ marginBottom: 0 }}>
									<Input
										value={data.listType ?? ''}
										readOnly={readOnly}
										onChange={(e) => setField('listType', e.target.value)}
									/>
								</Form.Item>
								<Form.Item label="Активно" style={{ marginBottom: 0 }}>
									<Switch
										checked={Boolean(data.active)}
										disabled={readOnly}
										onChange={(checked) => setField('active', checked)}
									/>
								</Form.Item>
								<Form.Item label="Обязательное" style={{ marginBottom: 0 }}>
									<Switch
										checked={Boolean(data.required)}
										disabled={readOnly}
										onChange={(checked) => setField('required', checked)}
									/>
								</Form.Item>
								<Form.Item label="Множественное" style={{ marginBottom: 0 }}>
									<Switch
										checked={Boolean(data.multiple)}
										disabled={readOnly}
										onChange={(checked) => setField('multiple', checked)}
									/>
								</Form.Item>
								<Form.Item label="Постфикс" style={{ marginBottom: 0 }}>
									<Input
										value={data.postfix ?? ''}
										readOnly={readOnly}
										onChange={(e) => setField('postfix', e.target.value)}
									/>
								</Form.Item>
								<Form.Item label="Значение по умолчанию" style={{ marginBottom: 0 }}>
									<Input
										value={String(data.defaultValue ?? '')}
										readOnly={readOnly}
										onChange={(e) => setField('defaultValue', e.target.value)}
									/>
								</Form.Item>
							</Flex>
						),
					},
					{
						key: 'enums',
						label: 'Значения',
						children: (
							<PropertyEnumsEditor
								variant="inline"
								enums={normalizeEnumRecord(data.enums)}
								readOnly={readOnly}
								onChange={(enums, defaultValue) => {
									setField('enums', enums);
									setField('defaultValue', defaultValue);
								}}
							/>
						),
					},
				];

				if (!isNew && !data.prototype_id) {
					items.push({
						key: 'links',
						label: 'Связанные свойства',
						children: (
							<PropertyLinksEditor
								links={normalizeIdRecord<PropertyLinkItem>(data.links)}
								propertyName={data.name ?? ''}
								propertyCode={data.code ?? ''}
								readOnly={readOnly}
								onChange={(links) => setField('links', links)}
								onOpenType={(typeKind, typeId) => {
									launchApp(typeKind === 'component' ? 'device-component' : 'device-type', typeId);
								}}
							/>
						),
					});
				}

				return <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />;
			}}
		</MainEntityForm>
	);
}
