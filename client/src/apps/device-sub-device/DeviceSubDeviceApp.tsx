import { Alert, Flex, Form, Input, Table, Tabs, Typography } from 'antd';
import { useCallback } from 'react';

import { subDeviceApi, type SubDeviceDetail } from '@/core/api/endpoints/deviceApi';
import { useAppContext } from '@/core/context/AppContext';
import { DeviceInfoTab } from '@/features/device/DeviceInfoTab';
import { SubDeviceAccountingFields } from '@/features/device/SubDeviceAccountingFields';
import { SubDevicePropertiesEditor } from '@/features/device/SubDevicePropertiesEditor';
import {
	canCreateSubDevice,
	useCanDeleteSubDevice,
	useCanReadSubDevice,
	useCanUpdateSubDevice,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import {
	normalizeSubDevicePropertiesRecord,
	type SubDevicePropertyValue,
} from '@/features/device/subDevicePropertyUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateSubDeviceForm } from './deviceSubDeviceValidation';

const initialData: SubDeviceDetail = {
	id: 0,
	name: '',
	sn: '',
	type_id: null,
	parent_id: null,
	sort: 0,
	description: '',
	accounting: {},
	parentAccountings: [],
	histories: {},
	properties: {},
};

export default function DeviceSubDeviceApp() {
	const entityId = useEntityId();
	const { props: launchProps } = useAppContext();
	const canRead = useCanReadSubDevice();
	const canUpdate = useCanUpdateSubDevice();
	const canDelete = useCanDeleteSubDevice();
	const canCreate = canCreateSubDevice();
	const isNew = entityId === 0;

	const buildNewData = useCallback(async (): Promise<SubDeviceDetail> => {
		const typeId = Number(launchProps?.type_id);
		if (!Number.isFinite(typeId) || typeId <= 0) {
			throw new Error('Не выбран тип комплектующего');
		}
		const properties = await subDeviceApi.formProperties(typeId);
		const parentAccountings = await subDeviceApi.parentAccountings(typeId);
		return {
			...initialData,
			type_id: typeId,
			properties,
			parentAccountings,
		};
	}, [launchProps?.type_id]);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание комплектующего"
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
				description="Нет прав на просмотр комплектующего"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Комплектующее"
			queryKey={['device', 'subDevice']}
			listQueryKey={['device', 'subDevices']}
			load={subDeviceApi.get}
			save={subDeviceApi.update}
			create={subDeviceApi.create}
			remove={subDeviceApi.remove}
			initialData={initialData}
			buildNewData={isNew ? buildNewData : undefined}
			validate={validateSubDeviceForm}
			transformBeforeSave={({ parentAccountings: _parentAccountings, ...payload }) => {
				const accounting = {
					...((payload.accounting ?? {}) as Record<string, unknown>),
				};
				if (accounting.detachParent) {
					accounting.parent_id = 'detach';
				}
				delete accounting.detachParent;
				return { ...payload, accounting };
			}}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => {
				const properties = normalizeSubDevicePropertiesRecord(
					data.properties,
				) as Record<string, SubDevicePropertyValue>;
				const historyRows = Object.values(normalizeIdRecord(data.histories)).sort((a, b) =>
					String(b.date ?? '').localeCompare(String(a.date ?? '')),
				);

				return (
					<Tabs
						defaultActiveKey="general"
						items={[
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
										<Form.Item label="Серийный номер" style={{ marginBottom: 0 }}>
											<Input
												value={data.sn ?? ''}
												readOnly={readOnly}
												onChange={(e) => setField('sn', e.target.value)}
											/>
										</Form.Item>
										<Form.Item label="Описание" style={{ marginBottom: 0 }}>
											<Input.TextArea
												value={data.description ?? ''}
												readOnly={readOnly}
												autoSize={{ minRows: 3 }}
												onChange={(e) => setField('description', e.target.value)}
											/>
										</Form.Item>
									</Flex>
								),
							},
							{
								key: 'accounting',
								label: 'Учёт',
								children: (
									<SubDeviceAccountingFields
										accounting={(data.accounting ?? {}) as Record<string, unknown>}
										parentAccountings={data.parentAccountings ?? []}
										readOnly={readOnly}
										onChange={(accounting) =>
											setField('accounting', accounting as Record<string, unknown>)
										}
									/>
								),
							},
							{
								key: 'properties',
								label: 'Свойства',
								children: (
									<SubDevicePropertiesEditor
										properties={properties}
										readOnly={readOnly}
										onChange={(next) => setField('properties', next)}
									/>
								),
							},
							{
								key: 'info',
								label: 'Сведения',
								children: (
									<Flex vertical gap={24}>
										<DeviceInfoTab data={data} layout="rows" />
										<Flex vertical gap={8}>
											<Typography.Text strong style={{ fontSize: 14 }}>
												История
											</Typography.Text>
											{historyRows.length === 0 ? (
												<Typography.Text type="secondary">История пуста</Typography.Text>
											) : (
												<Table
													size="small"
													bordered
													pagination={false}
													rowKey={(item) => String(item.id ?? `${item.date}-${item.place}`)}
													dataSource={historyRows}
													columns={[
														{ title: 'Дата', dataIndex: 'date', key: 'date', width: 120 },
														{ title: 'Устройство', dataIndex: 'place', key: 'place' },
													]}
												/>
											)}
										</Flex>
									</Flex>
								),
							},
						]}
					/>
				);
			}}
		</MainEntityForm>
	);
}
