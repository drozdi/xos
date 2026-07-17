import { Alert, NumberInput, Stack, Tabs, TextInput } from '@mantine/core';
import { useState } from 'react';

import { deviceLicenseKeyApi, type LicenseKeyDetail } from '@/core/api/endpoints/deviceApi';
import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import {
	useCanReadDeviceLicenseKey,
	useCanUpdateDeviceLicenseKey,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceLicenseKeyForm } from './deviceLicenseKeyValidation';

const initialData: LicenseKeyDetail = {
	id: 0,
	name: '',
	license_id: null,
	software_id: null,
	type_id: null,
	keys: {},
};

export default function DeviceLicenseKeyApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceLicenseKey();
	const canUpdate = useCanUpdateDeviceLicenseKey();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	if (isNew) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Создание ключей лицензий недоступно
			</Alert>
		);
	}

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр ключа лицензии
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Ключ лицензии"
			queryKey={['device', 'licenseKey']}
			listQueryKey={['device', 'licenseKeys']}
			load={deviceLicenseKeyApi.get}
			save={deviceLicenseKeyApi.update}
			create={async () => 0}
			initialData={initialData}
			validate={validateDeviceLicenseKeyForm}
			canSave={canUpdate}
			canDelete={false}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="keys">Ключи</Tabs.Tab>
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
							<NumberInput
								label="Лицензия (ID)"
								value={data.license_id ?? undefined}
								readOnly={readOnly}
								onChange={(value) =>
									setField('license_id', typeof value === 'number' ? value : null)
								}
							/>
							<NumberInput
								label="Программа (ID)"
								value={data.software_id ?? undefined}
								readOnly={readOnly}
								onChange={(value) =>
									setField('software_id', typeof value === 'number' ? value : null)
								}
							/>
							<NumberInput
								label="Тип (ID)"
								value={data.type_id ?? undefined}
								readOnly={readOnly}
								onChange={(value) =>
									setField('type_id', typeof value === 'number' ? value : null)
								}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="keys" pt="sm">
						<RecordCollectionEditor
							title="Ключи"
							records={normalizeIdRecord(data.keys)}
							readOnly={readOnly}
							columns={[
								{ key: 'typeKey', label: 'Тип ключа' },
								{ key: 'value', label: 'Значение' },
								{ key: 'actived', label: 'Активирован' },
								{ key: 'software_id', label: 'Программа (ID)' },
							]}
							onChange={(keys) => setField('keys', keys)}
							createItem={() => ({
								id: 0,
								typeKey: '',
								value: '',
								actived: '',
								software_id: '',
							})}
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
