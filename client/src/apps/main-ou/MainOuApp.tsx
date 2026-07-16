import { Alert, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core';

import { mainOuApi, type OuDetail } from '@/core/api/endpoints/mainApi';
import { canCreateMainOu, useCanDeleteMainOu, useCanReadMainOu, useCanUpdateMainOu } from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';
import { UserSelect, tutorOuUserFilters } from '@/features/main/UserSelect';

import { validateOuForm } from './mainOuValidation';

const initialData: OuDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	is_tutors: false,
	user_id: null,
};

export default function MainOuApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainOu();
	const canUpdate = useCanUpdateMainOu();
	const canDelete = useCanDeleteMainOu();
	const canSave = entityId === 0 ? canCreateMainOu() : canUpdate;

	if (entityId === 0 && !canCreateMainOu()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание подразделения
			</Alert>
		);
	}

	if (entityId !== 0 && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр подразделения
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Подразделение"
			queryKey={['main', 'ou']}
			listQueryKey={['main', 'ous']}
			load={mainOuApi.get}
			save={mainOuApi.update}
			create={mainOuApi.create}
			remove={mainOuApi.remove}
			initialData={initialData}
			validate={validateOuForm}
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
						label="Руководители"
						checked={Boolean(data.is_tutors)}
						disabled={readOnly}
						onChange={(e) => setField('is_tutors', e.currentTarget.checked)}
					/>
					<UserSelect
						withAsterisk
						value={data.user_id ?? null}
						error={errors.user_id}
						filters={tutorOuUserFilters}
						disabled={readOnly}
						onChange={(userId) => setField('user_id', userId)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
