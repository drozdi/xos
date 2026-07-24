import { Alert, DatePicker, Flex, Form, Input, InputNumber, Select, Tabs } from 'antd';
import dayjs from 'dayjs';
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

function toDayjs(value: string) {
	const parsed = parseLicenseDate(value);
	if (!parsed) {
		return null;
	}
	const d = dayjs(parsed);
	return d.isValid() ? d : null;
}

export default function DeviceLicenseApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceLicense();
	const canUpdate = useCanUpdateDeviceLicense();
	const canDelete = useCanDeleteDeviceLicense();
	const canCreate = canCreateDeviceLicense();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState('general');

	const typeOptions = useMemo(
		() => LICENSE_TYPES.map((value) => ({ value, label: value })),
		[],
	);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание лицензии"
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
				description="Нет прав на просмотр лицензии"
				style={{ margin: 16 }}
			/>
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
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: 'general',
							label: 'Общие',
							children: (
								<Flex vertical gap={12}>
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
									<Form.Item label="Тип" style={{ marginBottom: 0 }}>
										<Select
											options={typeOptions}
											value={data.type || undefined}
											disabled={readOnly}
											onChange={(value) => setField('type', value ?? '')}
										/>
									</Form.Item>
									<Form.Item label="Номер" style={{ marginBottom: 0 }}>
										<Input
											value={data.no ?? ''}
											readOnly={readOnly}
											onChange={(e) => setField('no', e.target.value)}
										/>
									</Form.Item>
									<Form.Item label="Авт. номер" style={{ marginBottom: 0 }}>
										<Input
											value={data.autNo ?? ''}
											readOnly={readOnly}
											onChange={(e) => setField('autNo', e.target.value)}
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
									<Form.Item label="Дата выдачи" style={{ marginBottom: 0 }}>
										<DatePicker
											value={toDayjs(data.dateReal ?? '')}
											format="DD-MM-YYYY"
											disabled={readOnly}
											allowClear
											style={{ width: '100%' }}
											onChange={(value) =>
												setField('dateReal', formatLicenseDate(value ? value.toDate() : null))
											}
										/>
									</Form.Item>
								</Flex>
							),
						},
						{
							key: 'softwares',
							label: 'Программы',
							children: (
								<LicenseSoftwaresEditor
									records={normalizeIdRecord(data.softwares)}
									readOnly={readOnly}
									onChange={(softwares) => setField('softwares', softwares)}
								/>
							),
						},
					]}
				/>
			)}
		</MainEntityForm>
	);
}
