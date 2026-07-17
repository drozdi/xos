import { Alert, NumberInput, Stack, Switch, Tabs, TextInput } from '@mantine/core';
import { useState } from 'react';

import { deviceComponentApi, type ComponentDetail } from '@/core/api/endpoints/deviceApi';
import { RecordCollectionEditor } from '@/features/device/RecordCollectionEditor';
import {
	canCreateDeviceComponent,
	useCanDeleteDeviceComponent,
	useCanReadDeviceComponent,
	useCanUpdateDeviceComponent,
} from '@/features/device/deviceAccess';
import { normalizeIdRecord, useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceComponentForm } from './deviceComponentValidation';

const initialData: ComponentDetail = {
	id: 0,
	name: '',
	code: '',
	sort: 0,
	active: true,
	children: {},
};

export default function DeviceComponentApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceComponent();
	const canUpdate = useCanUpdateDeviceComponent();
	const canDelete = useCanDeleteDeviceComponent();
	const canCreate = canCreateDeviceComponent();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание компонента
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр компонента
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Компонент"
			queryKey={['device', 'component']}
			listQueryKey={['device', 'components']}
			load={deviceComponentApi.get}
			save={deviceComponentApi.update}
			create={deviceComponentApi.create}
			remove={deviceComponentApi.remove}
			initialData={initialData}
			validate={validateDeviceComponentForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">Общие</Tabs.Tab>
						<Tabs.Tab value="children">Свойства</Tabs.Tab>
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
								label="Код"
								withAsterisk
								value={data.code ?? ''}
								error={errors.code}
								readOnly={readOnly}
								onChange={(e) => setField('code', e.currentTarget.value)}
							/>
							<NumberInput
								label="Сортировка"
								value={data.sort ?? 0}
								readOnly={readOnly}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
							/>
							<Switch
								label="Активен"
								checked={Boolean(data.active)}
								disabled={readOnly}
								onChange={(e) => setField('active', e.currentTarget.checked)}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="children" pt="sm">
						<RecordCollectionEditor
							title="Свойства"
							records={normalizeIdRecord(data.children)}
							readOnly={readOnly}
							columns={[
								{ key: 'name', label: 'Название' },
								{ key: 'code', label: 'Код' },
								{ key: 'fieldType', label: 'Тип поля' },
								{ key: 'sort', label: 'Сортировка' },
							]}
							onChange={(children) => setField('children', children)}
							createItem={() => ({
								id: 0,
								name: '',
								code: '',
								fieldType: '',
								sort: 0,
							})}
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</MainEntityForm>
	);
}
