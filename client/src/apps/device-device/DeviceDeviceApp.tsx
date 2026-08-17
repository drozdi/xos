import { Alert, Stack, Tabs } from '@mantine/core';
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
	file: null,
};

export default function DeviceDeviceApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDevice();
	const canUpdate = useCanUpdateDevice();
	const canDelete = useCanDeleteDevice();
	const canCreate = canCreateDevice();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание устройства
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр устройства
			</Alert>
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
			transformBeforeSave={(payload) => ({
				...payload,
				file: payload.file ?? null,
			})}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="accounting">Учёт</Tabs.Tab>
						<Tabs.Tab value="locations">Расположение</Tabs.Tab>
						<Tabs.Tab value="repairs">Ремонт</Tabs.Tab>
						<Tabs.Tab value="properties">Свойства</Tabs.Tab>
						<Tabs.Tab value="licenses">Лицензии</Tabs.Tab>
						<Tabs.Tab value="images">Изображения</Tabs.Tab>
						<Tabs.Tab value="info">Сведения</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="general" pt="sm">
						<DeviceGeneralTab
							data={data}
							deviceId={data.id}
							errors={errors}
							readOnly={readOnly}
							setField={setField}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="accounting" pt="sm">
						<DeviceAccountingFields
							accounting={(data.accounting ?? {}) as Record<string, unknown>}
							readOnly={readOnly}
							onChange={(accounting) =>
								setField('accounting', accounting as Record<string, unknown>)
							}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="locations" pt="sm">
						<DeviceLocationsTab
							locations={data.locations}
							readOnly={readOnly}
							onChange={(locations) => setField('locations', locations)}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="repairs" pt="sm">
						<DeviceRepairsTab
							repairs={data.repairs}
							readOnly={readOnly}
							onChange={(repairs) => setField('repairs', repairs)}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="properties" pt="sm">
						<DevicePropertiesTab
							typeId={data.typeId}
							properties={data.properties}
							readOnly={readOnly}
							onChange={(properties) => setField('properties', properties)}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="licenses" pt="sm">
						<DeviceLicensesTab
							licenses={data.licenses}
							readOnly={readOnly}
							onChange={(licenses) => setField('licenses', licenses)}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="images" pt="sm">
						<DeviceImagesTab
							deviceId={data.id}
							images={(data.images ?? {}) as Record<string, { id: number; src: string; name?: string }>}
							readOnly={readOnly}
							onChange={(images) => setField('images', images)}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="info" pt="sm">
						<Stack gap="lg">
							<DeviceInfoTab data={data} layout="rows" />
						</Stack>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
