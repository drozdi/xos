import { Alert, Flex, Tabs } from 'antd';
import { useState } from 'react';

import { deviceApi, type DeviceDetail } from '@/core/api/endpoints/deviceApi';
import { DeviceAccountingFields } from '@/features/device/DeviceAccountingFields';
import { DeviceInfoTab } from '@/features/device/DeviceInfoTab';
import {
	canCreateDevice,
	useCanDeleteDevice,
	useCanReadDevice,
	useCanUpdateDevice,
} from '@/features/device/deviceAccess';
import { useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { DeviceGeneralTab } from './DeviceGeneralTab';
import { DeviceImagesTab } from './DeviceImagesTab';
import { DeviceLicensesTab } from './DeviceLicensesTab';
import { DeviceLocationsTab } from './DeviceLocationsTab';
import { DevicePropertiesTab } from './DevicePropertiesTab';
import { DeviceRepairsTab } from './DeviceRepairsTab';
import { validateDeviceForm } from './deviceDeviceValidation';

const initialData: DeviceDetail = {
	id: 0,
	name: '',
	code: '',
	typeId: null,
	sort: 0,
	description: '',
	accounting: {},
	locations: {},
	repairs: {},
	properties: {},
	licenses: {},
	images: {},
};

export default function DeviceDeviceApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDevice();
	const canUpdate = useCanUpdateDevice();
	const canDelete = useCanDeleteDevice();
	const canCreate = canCreateDevice();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание устройства"
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
				description="Нет прав на просмотр устройства"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Устройство"
			queryKey={['device', 'device']}
			listQueryKey={['device', 'devices']}
			load={deviceApi.get}
			save={deviceApi.update}
			create={deviceApi.create}
			remove={deviceApi.remove}
			initialData={initialData}
			validate={validateDeviceForm}
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
								<DeviceGeneralTab
									data={data}
									errors={errors}
									readOnly={readOnly}
									setField={setField}
								/>
							),
						},
						{
							key: 'accounting',
							label: 'Учёт',
							children: (
								<DeviceAccountingFields
									accounting={(data.accounting ?? {}) as Record<string, unknown>}
									readOnly={readOnly}
									onChange={(accounting) =>
										setField('accounting', accounting as Record<string, unknown>)
									}
								/>
							),
						},
						{
							key: 'locations',
							label: 'Расположение',
							children: (
								<DeviceLocationsTab
									locations={data.locations}
									readOnly={readOnly}
									onChange={(locations) => setField('locations', locations)}
								/>
							),
						},
						{
							key: 'repairs',
							label: 'Ремонт',
							children: (
								<DeviceRepairsTab
									repairs={data.repairs}
									readOnly={readOnly}
									onChange={(repairs) => setField('repairs', repairs)}
								/>
							),
						},
						{
							key: 'properties',
							label: 'Свойства',
							children: (
								<DevicePropertiesTab
									typeId={data.typeId}
									properties={data.properties}
									readOnly={readOnly}
									onChange={(properties) => setField('properties', properties)}
								/>
							),
						},
						{
							key: 'licenses',
							label: 'Лицензии',
							children: (
								<DeviceLicensesTab
									licenses={data.licenses}
									readOnly={readOnly}
									onChange={(licenses) => setField('licenses', licenses)}
								/>
							),
						},
						{
							key: 'images',
							label: 'Изображения',
							children: <DeviceImagesTab images={data.images} />,
						},
						{
							key: 'info',
							label: 'Сведения',
							children: (
								<Flex vertical gap={24}>
									<DeviceInfoTab data={data} layout="rows" />
								</Flex>
							),
						},
					]}
				/>
			)}
		</MainEntityForm>
	);
}
