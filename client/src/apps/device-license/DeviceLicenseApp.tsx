import { Alert, NumberInput, Select, Stack, Tabs, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMemo, useState } from 'react';

import { deviceLicenseApi, type LicenseDetail } from '@/core/api/endpoints/deviceApi';
import {
	canCreateDeviceLicense,
	useCanDeleteDeviceLicense,
	useCanReadDeviceLicense,
	useCanUpdateDeviceLicense,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { LICENSE_TYPES } from './constants';
import { LicenseSoftwaresEditor } from './LicenseSoftwaresEditor';
import { formatLicenseDate, parseLicenseDate } from './licenseDateUtils';
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

	const typeOptions = useMemo(
		() => LICENSE_TYPES.map((value) => ({ value, label: value })),
		[],
	);

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
							<Select
								label="Тип"
								data={typeOptions}
								value={data.type || null}
								readOnly={readOnly}
								onChange={(value) => setField('type', value ?? '')}
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
							<DatePickerInput
								label="Дата выдачи"
								value={parseLicenseDate(data.dateReal)}
								valueFormat="DD-MM-YYYY"
								readOnly={readOnly}
								clearable
								onChange={(value) => setField('dateReal', formatLicenseDate(value))}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="softwares" pt="sm">
						<LicenseSoftwaresEditor
							records={normalizeIdRecord(data.softwares)}
							readOnly={readOnly}
							onChange={(softwares) => setField('softwares', softwares)}
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
