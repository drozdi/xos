import { Alert, Flex, Form, Input, Tabs } from 'antd';
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
	const [activeTab, setActiveTab] = useState('general');

	if (isNew) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Создание ключей лицензий недоступно"
				style={{ margin: 16 }}
			/>
		);
	}

	if (!canRead) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на просмотр ключа лицензии"
				style={{ margin: 16 }}
			/>
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
	activeTab: string;
	onTabChange: (value: string) => void;
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
		<Tabs
			activeKey={activeTab}
			onChange={onTabChange}
			items={[
				{
					key: 'general',
					label: 'Общая информация',
					children: (
						<Flex vertical gap={12}>
							<Form.Item label="Лицензия" style={{ marginBottom: 0 }}>
								<Input value={licenseQuery.data?.code ?? data.name ?? ''} readOnly />
							</Form.Item>
							<Form.Item label="Тип лицензии" style={{ marginBottom: 0 }}>
								<Input value={licenseQuery.data?.type ?? ''} readOnly />
							</Form.Item>
							<Form.Item label="Дата выдачи" style={{ marginBottom: 0 }}>
								<Input value={licenseQuery.data?.dateReal ?? ''} readOnly />
							</Form.Item>
							<Form.Item label="Номер" style={{ marginBottom: 0 }}>
								<Input value={licenseQuery.data?.no ?? ''} readOnly />
							</Form.Item>
							<Form.Item label="Авт. номер" style={{ marginBottom: 0 }}>
								<Input value={licenseQuery.data?.autNo ?? ''} readOnly />
							</Form.Item>
							<Form.Item label="Тип программы" style={{ marginBottom: 0 }}>
								<Input value={typeName} readOnly />
							</Form.Item>
							<Form.Item
								label="Программа"
								validateStatus={errors.name ? 'error' : undefined}
								help={errors.name}
								style={{ marginBottom: 0 }}
							>
								<Input value={softwareQuery.data?.name ?? ''} readOnly />
							</Form.Item>
						</Flex>
					),
				},
				{
					key: 'keys',
					label: 'Ключи',
					children: (
						<LicenseKeysEditor
							typeId={data.type_id}
							records={normalizeIdRecord(data.keys)}
							readOnly={readOnly}
							onChange={onKeysChange}
						/>
					),
				},
			]}
		/>
	);
}
