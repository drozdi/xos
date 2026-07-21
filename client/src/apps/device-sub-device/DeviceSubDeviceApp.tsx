import { Alert, Stack, Table, Tabs, Text, TextInput, Textarea } from '@mantine/core';
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
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание комплектующего
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр комплектующего
			</Alert>
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
					<Tabs defaultValue="general">
						<Tabs.List>
							<Tabs.Tab value="general">Общие</Tabs.Tab>
							<Tabs.Tab value="accounting">Учёт</Tabs.Tab>
							<Tabs.Tab value="properties">Свойства</Tabs.Tab>
							<Tabs.Tab value="info">Сведения</Tabs.Tab>
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
									label="Серийный номер"
									value={data.sn ?? ''}
									readOnly={readOnly}
									onChange={(e) => setField('sn', e.currentTarget.value)}
								/>
								<Textarea
									label="Описание"
									value={data.description ?? ''}
									readOnly={readOnly}
									minRows={3}
									autosize
									onChange={(e) => setField('description', e.currentTarget.value)}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value="accounting" pt="sm">
							<SubDeviceAccountingFields
								accounting={(data.accounting ?? {}) as Record<string, unknown>}
								parentAccountings={data.parentAccountings ?? []}
								readOnly={readOnly}
								onChange={(accounting) =>
									setField('accounting', accounting as Record<string, unknown>)
								}
							/>
						</Tabs.Panel>

						<Tabs.Panel value="properties" pt="sm">
							<SubDevicePropertiesEditor
								properties={properties}
								readOnly={readOnly}
								onChange={(next) => setField('properties', next)}
							/>
						</Tabs.Panel>

						<Tabs.Panel value="info" pt="sm">
							<Stack gap="lg">
								<DeviceInfoTab data={data} layout="rows" />
								<Stack gap="xs">
									<Text fw={500} size="sm">
										История
									</Text>
									{historyRows.length === 0 ? (
										<Text c="dimmed" size="sm">
											История пуста
										</Text>
									) : (
										<Table striped highlightOnHover withTableBorder>
											<Table.Thead>
												<Table.Tr>
													<Table.Th w={120}>Дата</Table.Th>
													<Table.Th>Устройство</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{historyRows.map((item) => (
													<Table.Tr key={String(item.id ?? `${item.date}-${item.place}`)}>
														<Table.Td>{String(item.date ?? '')}</Table.Td>
														<Table.Td>{String(item.place ?? '')}</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									)}
								</Stack>
							</Stack>
						</Tabs.Panel>
					</Tabs>
				);
			}}
		</MainEntityForm>
	);
}
