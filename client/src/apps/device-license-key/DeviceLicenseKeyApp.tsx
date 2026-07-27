import { Alert, Stack, Tabs, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
	deviceLicenseApi,
	deviceLicenseKeyApi,
	deviceSoftwareApi,
	deviceSoftwareTypeApi,
	type LicenseKeyDetail,
} from '@/core/api/endpoints/deviceApi';
import {
	useCanReadDeviceLicenseKey,
	useCanUpdateDeviceLicenseKey,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { LicenseKeysEditor } from './LicenseKeysEditor';
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
				<LicenseKeyFormBody
					data={data}
					errors={errors}
					readOnly={readOnly}
					activeTab={activeTab}
					onTabChange={setActiveTab}
					onKeysChange={(keys) => setField('keys', keys)}
				/>
			)}
		</MainEntityForm>
	);
}

function LicenseKeyFormBody({
	data,
	errors,
	readOnly,
	activeTab,
	onTabChange,
	onKeysChange,
}: {
	data: LicenseKeyDetail;
	errors: Partial<Record<string, string>>;
	readOnly: boolean;
	activeTab: string | null;
	onTabChange: (value: string | null) => void;
	onKeysChange: (keys: Record<string, Record<string, unknown>>) => void;
}) {
	const licenseQuery = useQuery({
		queryKey: ['device', 'license', data.license_id],
		queryFn: () => deviceLicenseApi.get(data.license_id!),
		enabled: data.license_id != null,
	});

	const typesQuery = useQuery({
		queryKey: ['device', 'softwareTypes', 'license-key'],
		queryFn: () => deviceSoftwareTypeApi.list({ limit: -1, offset: 1 }),
	});

	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'license-key', data.software_id],
		queryFn: () => deviceSoftwareApi.get(data.software_id!),
		enabled: data.software_id != null,
	});

	const typeName = useMemo(() => {
		if (data.type_id == null) {
			return '';
		}
		const type = (typesQuery.data?.items ?? []).find((item) => item.id === data.type_id);
		return type?.name ?? String(data.type_id);
	}, [data.type_id, typesQuery.data?.items]);

	return (
		<Tabs value={activeTab} onChange={onTabChange}>
			<Tabs.List>
				<Tabs.Tab value="general">Общая информация</Tabs.Tab>
				<Tabs.Tab value="keys">Ключи</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value="general" pt="sm">
				<Stack gap="sm">
					<TextInput label="Лицензия" value={licenseQuery.data?.code ?? data.name ?? ''} readOnly />
					<TextInput label="Тип лицензии" value={licenseQuery.data?.type ?? ''} readOnly />
					<TextInput label="Дата выдачи" value={licenseQuery.data?.dateReal ?? ''} readOnly />
					<TextInput label="Номер" value={licenseQuery.data?.no ?? ''} readOnly />
					<TextInput label="Авт. номер" value={licenseQuery.data?.autNo ?? ''} readOnly />
					<TextInput label="Тип программы" value={typeName} readOnly />
					<TextInput
						label="Программа"
						value={softwareQuery.data?.name ?? ''}
						error={errors.name}
						readOnly
					/>
				</Stack>
			</Tabs.Panel>

			<Tabs.Panel value="keys" pt="sm">
				<LicenseKeysEditor
					typeId={data.type_id}
					records={normalizeIdRecord(data.keys)}
					readOnly={readOnly}
					onChange={onKeysChange}
				/>
			</Tabs.Panel>
		</Tabs>
	);
}
