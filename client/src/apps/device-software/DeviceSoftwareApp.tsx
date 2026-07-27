import { Alert, NumberInput, Select, Stack, TextInput } from '@mantine/core';
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
			// Mantine Select не поддерживает дублирующие value.
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
			// Mantine Select не поддерживает дублирующие value.
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
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание программы
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр программы
			</Alert>
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
					<Select
						label="Тип"
						data={typeOptions}
						value={data.type_id ? String(data.type_id) : null}
						readOnly={readOnly}
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
						searchable
						clearable
					/>
					<Select
						label="Родитель"
						data={parentOptions}
						value={data.parent_id ? String(data.parent_id) : null}
						readOnly={readOnly}
						onChange={(value) => setField('parent_id', value ? Number(value) : null)}
						searchable
						clearable
					/>
				</Stack>
				);
			}}
		</MainEntityForm>
	);
}
