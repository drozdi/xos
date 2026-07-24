import { Alert, Flex, Form, Input, InputNumber } from 'antd';

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
	code: '',
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
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание типа программы"
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
				description="Нет прав на просмотр типа программы"
				style={{ margin: 16 }}
			/>
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
					<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
						<InputNumber
							value={data.sort ?? 0}
							disabled={readOnly}
							style={{ width: '100%' }}
							onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
						/>
					</Form.Item>
				</Flex>
			)}
		</MainEntityForm>
	);
}
