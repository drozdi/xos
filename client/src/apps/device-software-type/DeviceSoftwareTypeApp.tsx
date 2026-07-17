import { Alert, NumberInput, Stack, TextInput } from '@mantine/core';

import { deviceSoftwareTypeApi, type SoftwareTypeDetail } from '@/core/api/endpoints/deviceApi';
import {
	canCreateDeviceSoftwareType,
	useCanDeleteDeviceSoftwareType,
	useCanReadDeviceSoftwareType,
	useCanUpdateDeviceSoftwareType,
} from '@/features/device/deviceAccess';
import { useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceSoftwareTypeForm } from './deviceSoftwareTypeValidation';

const initialData: SoftwareTypeDetail = {
	id: 0,
	name: '',
	sort: 0,
};

export default function DeviceSoftwareTypeApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceSoftwareType();
	const canUpdate = useCanUpdateDeviceSoftwareType();
	const canDelete = useCanDeleteDeviceSoftwareType();
	const canCreate = canCreateDeviceSoftwareType();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание типа программы
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типа программы
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Тип программы"
			queryKey={['device', 'softwareType']}
			listQueryKey={['device', 'softwareTypes']}
			load={deviceSoftwareTypeApi.get}
			save={deviceSoftwareTypeApi.update}
			create={deviceSoftwareTypeApi.create}
			remove={deviceSoftwareTypeApi.remove}
			initialData={initialData}
			validate={validateDeviceSoftwareTypeForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
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
						label="Сортировка"
						value={data.sort ?? 0}
						readOnly={readOnly}
						onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
