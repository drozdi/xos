import { Alert, Flex, Form, Input, InputNumber, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { deviceSoftwareApi, deviceSoftwareTypeApi, type SoftwareDetail } from '@/core/api/endpoints/deviceApi';
import {
	canCreateDeviceSoftware,
	useCanDeleteDeviceSoftware,
	useCanReadDeviceSoftware,
	useCanUpdateDeviceSoftware,
} from '@/features/device/deviceAccess';
import { useEntityId } from '@/features/device/deviceAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateDeviceSoftwareForm } from './deviceSoftwareValidation';

const initialData: SoftwareDetail = {
	id: 0,
	name: '',
	sort: 0,
	type_id: null,
	parent_id: null,
};

export default function DeviceSoftwareApp() {
	const entityId = useEntityId();
	const canRead = useCanReadDeviceSoftware();
	const canUpdate = useCanUpdateDeviceSoftware();
	const canDelete = useCanDeleteDeviceSoftware();
	const canCreate = canCreateDeviceSoftware();
	const isNew = entityId === 0;

	const typesQuery = useQuery({
		queryKey: ['device', 'softwareTypes', 'select'],
		queryFn: () => deviceSoftwareTypeApi.list({ limit: -1, offset: 1 }),
	});

	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'select'],
		queryFn: () => deviceSoftwareApi.list({ limit: -1, offset: 1 }),
	});

	const typeOptions = useMemo(
		() => {
			const byValue = new Map<string, { value: string; label: string }>();
			for (const item of typesQuery.data?.items ?? []) {
				const value = String(item.id);
				byValue.set(value, {
					value,
					label: item.name ?? value,
				});
			}
			return Array.from(byValue.values());
		},
		[typesQuery.data?.items],
	);

	const rootSoftwareOptions = useMemo(
		() => {
			const byValue = new Map<string, { value: string; label: string; typeId: number | null }>();
			for (const item of softwareQuery.data?.items ?? []) {
				if (item.id === entityId) {
					continue;
				}
				const value = String(item.id);
				byValue.set(value, {
					value,
					label: item.name ?? value,
					typeId: item.type_id ?? null,
				});
			}
			return Array.from(byValue.values());
		},
		[softwareQuery.data?.items, entityId],
	);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание программы"
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
				description="Нет прав на просмотр программы"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Программа"
			queryKey={['device', 'software', 'detail']}
			listQueryKey={['device', 'software']}
			load={deviceSoftwareApi.get}
			save={deviceSoftwareApi.update}
			create={deviceSoftwareApi.create}
			remove={deviceSoftwareApi.remove}
			initialData={initialData}
			validate={validateDeviceSoftwareForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => {
				const parentOptions = rootSoftwareOptions
					.filter((item) => (data.type_id ? item.typeId === data.type_id : true))
					.map(({ value, label }) => ({ value, label }));

				return (
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
						<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
							<InputNumber
								value={data.sort ?? 0}
								disabled={readOnly}
								style={{ width: '100%' }}
								onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
							/>
						</Form.Item>
						<Form.Item label="Тип" style={{ marginBottom: 0 }}>
							<Select
								options={typeOptions}
								value={data.type_id ? String(data.type_id) : undefined}
								disabled={readOnly}
								onChange={(value) => {
									const nextTypeId = value ? Number(value) : null;
									setField('type_id', nextTypeId);
									if (data.parent_id) {
										const parentExists = rootSoftwareOptions.some(
											(item) => item.value === String(data.parent_id) && item.typeId === nextTypeId,
										);
										if (!parentExists) {
											setField('parent_id', null);
										}
									}
								}}
								showSearch
								allowClear
							/>
						</Form.Item>
						<Form.Item label="Родитель" style={{ marginBottom: 0 }}>
							<Select
								options={parentOptions}
								value={data.parent_id ? String(data.parent_id) : undefined}
								disabled={readOnly}
								onChange={(value) => setField('parent_id', value ? Number(value) : null)}
								showSearch
								allowClear
							/>
						</Form.Item>
					</Flex>
				);
			}}
		</MainEntityForm>
	);
}
