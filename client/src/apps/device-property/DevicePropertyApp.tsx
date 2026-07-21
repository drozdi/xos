import { Alert, NumberInput, Stack, Switch, Tabs, TextInput } from '@mantine/core';
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
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание свойства
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр свойства
			</Alert>
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
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="enums">Значения</Tabs.Tab>
						{!isNew && !data.prototype_id ? (
							<Tabs.Tab value="links">Связанные свойства</Tabs.Tab>
						) : null}
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
							<TextInput
								label="Тип поля"
								value={data.fieldType ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('fieldType', e.currentTarget.value)}
							/>
							<TextInput
								label="Тип списка"
								value={data.listType ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('listType', e.currentTarget.value)}
							/>
							<Switch
								label="Активно"
								checked={Boolean(data.active)}
								disabled={readOnly}
								onChange={(e) => setField('active', e.currentTarget.checked)}
							/>
							<Switch
								label="Обязательное"
								checked={Boolean(data.required)}
								disabled={readOnly}
								onChange={(e) => setField('required', e.currentTarget.checked)}
							/>
							<Switch
								label="Множественное"
								checked={Boolean(data.multiple)}
								disabled={readOnly}
								onChange={(e) => setField('multiple', e.currentTarget.checked)}
							/>
							<TextInput
								label="Постфикс"
								value={data.postfix ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('postfix', e.currentTarget.value)}
							/>
							<TextInput
								label="Значение по умолчанию"
								value={String(data.defaultValue ?? '')}
								readOnly={readOnly}
								onChange={(e) => setField('defaultValue', e.currentTarget.value)}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="enums" pt="sm">
						<PropertyEnumsEditor
							variant="inline"
							enums={normalizeEnumRecord(data.enums)}
							readOnly={readOnly}
							onChange={(enums, defaultValue) => {
								setField('enums', enums);
								setField('defaultValue', defaultValue);
							}}
						/>
					</Tabs.Panel>

					{!isNew && !data.prototype_id ? (
						<Tabs.Panel value="links" pt="sm">
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
						</Tabs.Panel>
					) : null}
				</Tabs>
			)}
		</MainEntityForm>
	);
}
