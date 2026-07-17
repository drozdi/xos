import { Alert, NumberInput, Select, Stack, Tabs, TextInput, Textarea } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { subDeviceApi, type SubDeviceDetail } from '@/core/api/endpoints/deviceApi';
import { DeviceAccountingFields } from '@/features/device/DeviceAccountingFields';
import { DeviceInfoTab } from '@/features/device/DeviceInfoTab';
import { ReadOnlyRecordList } from '@/features/device/ReadOnlyRecordList';
import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import {
	canCreateSubDevice,
	useCanDeleteSubDevice,
	useCanReadSubDevice,
	useCanUpdateSubDevice,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateSubDeviceForm } from './deviceSubDeviceValidation';

const initialData: SubDeviceDetail = {
	id: 0,
	name: '',
	type_id: null,
	sort: 0,
	description: '',
	accounting: {},
	histories: {},
	properties: {},
};

export default function DeviceSubDeviceApp() {
	const entityId = useEntityId();
	const canRead = useCanReadSubDevice();
	const canUpdate = useCanUpdateSubDevice();
	const canDelete = useCanDeleteSubDevice();
	const canCreate = canCreateSubDevice();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const filterQuery = useQuery({
		queryKey: ['device', 'subDeviceFilter'],
		queryFn: async () => {
			const { data } = await import('@/core/api/client').then((m) =>
				m.apiClient.get<unknown>('/api/device/subDevices/filter'),
			);
			return data as Array<{ label?: string; value?: number }>;
		},
	});

	const typeOptions = useMemo(
		() =>
			(filterQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.label ?? String(item.value),
			})),
		[filterQuery.data],
	);

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
			validate={validateSubDeviceForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="accounting">Учёт</Tabs.Tab>
						<Tabs.Tab value="histories">История</Tabs.Tab>
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
							<Select
								label="Тип"
								data={typeOptions}
								value={data.type_id ? String(data.type_id) : null}
								readOnly={readOnly}
								onChange={(value) => setField('type_id', value ? Number(value) : null)}
								searchable
								clearable
							/>
							<NumberInput
								label="Сортировка"
								value={data.sort ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
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
						<DeviceAccountingFields
							accounting={(data.accounting ?? {}) as Record<string, unknown>}
							readOnly={readOnly}
							onChange={(accounting) =>
								setField('accounting', accounting as Record<string, unknown>)
							}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="histories" pt="sm">
						<RecordCollectionEditor
							title="История"
							records={normalizeIdRecord(data.histories)}
							readOnly={readOnly}
							columns={[
								{ key: 'date', label: 'Дата' },
								{ key: 'place', label: 'Место' },
							]}
							onChange={(histories) => setField('histories', histories)}
							createItem={() => ({ id: 0, date: '', place: '', parent_id: 0 })}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="properties" pt="sm">
						<ReadOnlyRecordList
							records={normalizeIdRecord(data.properties)}
							labelFields={['name', 'title', 'value']}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="info" pt="sm">
						<DeviceInfoTab data={data} />
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
