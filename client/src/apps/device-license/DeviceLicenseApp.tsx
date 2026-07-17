import { Alert, NumberInput, Stack, Tabs, TextInput } from '@mantine/core';
import { useState } from 'react';

import { deviceLicenseApi, type LicenseDetail } from '@/core/api/endpoints/deviceApi';
import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import {
	canCreateDeviceLicense,
	useCanDeleteDeviceLicense,
	useCanReadDeviceLicense,
	useCanUpdateDeviceLicense,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceLicenseForm } from './deviceLicenseValidation';

const initialData: LicenseDetail = {
	id: 0,
	code: '',
	type: '',
	no: '',
	autNo: '',
	sort: 0,
	dateReal: '',
	softwares: {},
};

export default function DeviceLicenseApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceLicense();
	const canUpdate = useCanUpdateDeviceLicense();
	const canDelete = useCanDeleteDeviceLicense();
	const canCreate = canCreateDeviceLicense();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание лицензии
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр лицензии
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Лицензия"
			queryKey={['device', 'license']}
			listQueryKey={['device', 'licenses']}
			load={deviceLicenseApi.get}
			save={deviceLicenseApi.update}
			create={deviceLicenseApi.create}
			remove={deviceLicenseApi.remove}
			initialData={initialData}
			validate={validateDeviceLicenseForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="softwares">Программы</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="general" pt="sm">
						<Stack gap="sm">
							<TextInput
								label="Код"
								withAsterisk
								value={data.code ?? ''}
								error={errors.code}
								readOnly={readOnly}
								onChange={(e) => setField('code', e.currentTarget.value)}
							/>
							<TextInput
								label="Тип"
								value={data.type ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('type', e.currentTarget.value)}
							/>
							<TextInput
								label="Номер"
								value={data.no ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('no', e.currentTarget.value)}
							/>
							<TextInput
								label="Авт. номер"
								value={data.autNo ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('autNo', e.currentTarget.value)}
							/>
							<NumberInput
								label="Сортировка"
								value={data.sort ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
							/>
							<TextInput
								label="Дата"
								value={data.dateReal ?? ''}
								readOnly={readOnly}
								onChange={(e) => setField('dateReal', e.currentTarget.value)}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="softwares" pt="sm">
						<RecordCollectionEditor
							title="Программы"
							records={normalizeIdRecord(data.softwares)}
							readOnly={readOnly}
							columns={[
								{ key: 'type_id', label: 'Тип (ID)' },
								{ key: 'software_id', label: 'Программа (ID)' },
								{ key: 'count', label: 'Количество' },
							]}
							onChange={(softwares) => setField('softwares', softwares)}
							createItem={() => ({
								id: 0,
								type_id: '',
								software_id: '',
								count: 1,
							})}
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
