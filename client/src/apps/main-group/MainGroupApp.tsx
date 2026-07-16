import { Alert, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core';

import { mainGroupApi, type GroupDetail } from '@/core/api/endpoints/mainApi';
import {
	canCreateMainGroup,
	useCanDeleteMainGroup,
	useCanReadMainGroup,
	useCanUpdateMainGroup,
} from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';

import { validateGroupForm } from './mainGroupValidation';

const initialData: GroupDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	active: true,
};

export default function MainGroupApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainGroup();
	const canUpdate = useCanUpdateMainGroup();
	const canDelete = useCanDeleteMainGroup();
	const canSave = entityId === 0 ? canCreateMainGroup() : canUpdate;

	if (entityId === 0 && !canCreateMainGroup()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание группы
			</Alert>
		);
	}

	if (entityId !== 0 && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр группы
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Группа"
			queryKey={['main', 'group']}
			listQueryKey={['main', 'groups']}
			load={mainGroupApi.get}
			save={mainGroupApi.update}
			create={mainGroupApi.create}
			remove={mainGroupApi.remove}
			initialData={initialData}
			validate={validateGroupForm}
			canSave={canSave}
			canDelete={canDelete}
			headerNote={({ data, isNew }) =>
				!isNew && data.x_timestamp ? (
					<Text size="sm" c="dimmed">
						Последнее обновление: {String(data.x_timestamp)}
					</Text>
				) : null
			}
		>
			{({ data, setField, errors, readOnly }) => (
				<Stack gap="sm">
					<TextInput
						label="Код"
						withAsterisk
						value={data.code ?? ''}
						error={errors.code}
						readOnly={readOnly}
						onChange={(e) => setField('code', e.currentTarget.value)}
					/>
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
					<TextInput
						label="Описание"
						value={data.description ?? ''}
						readOnly={readOnly}
						onChange={(e) => setField('description', e.currentTarget.value)}
					/>
					<Switch
						label="Активна"
						checked={Boolean(data.active)}
						disabled={readOnly}
						onChange={(e) => setField('active', e.currentTarget.checked)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
