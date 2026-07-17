import { Alert, MultiSelect, NumberInput, Stack, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { schooltaskSubjectApi, type SubjectDetail } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	canCreateSchooltaskSubject,
	useCanDeleteSchooltaskSubject,
	useCanReadSchooltaskSubject,
	useCanUpdateSchooltaskSubject,
} from '@/features/schooltask/schooltaskAccess';
import { extractSubjectUserIds, useEntityId } from '@/features/schooltask/schooltaskAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

const initialData: SubjectDetail = {
	id: 0,
	name: '',
	sort: 100,
	users: [],
};

function validateSubjectForm(data: SubjectDetail) {
	const errors: Partial<Record<'name', string>> = {};
	if (!data.name?.trim()) {
		errors.name = 'Укажите название';
	}
	return errors;
}

export default function SchooltaskSubjectApp() {
	const entityId = useEntityId();
	const canRead = useCanReadSchooltaskSubject();
	const canUpdate = useCanUpdateSchooltaskSubject();
	const canDelete = useCanDeleteSchooltaskSubject();
	const canCreate = canCreateSchooltaskSubject();
	const isNew = entityId === 0;

	const teachersQuery = useQuery({
		queryKey: queryKeys.schooltask.subjectTeachers,
		queryFn: () => schooltaskSubjectApi.teachersOptions(),
	});

	const teacherOptions = useMemo(
		() =>
			(teachersQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[teachersQuery.data],
	);

	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание предмета
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр предмета
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Предмет"
			queryKey={['schooltask', 'subject']}
			listQueryKey={['schooltask', 'subjects']}
			load={schooltaskSubjectApi.get}
			save={schooltaskSubjectApi.update}
			create={schooltaskSubjectApi.create}
			remove={schooltaskSubjectApi.remove}
			initialData={initialData}
			validate={validateSubjectForm}
			canSave={canSave}
			canDelete={canDelete}
			transformBeforeSave={(data) => ({
				...data,
				user_ids: extractSubjectUserIds(data.users),
			})}
		>
			{({ data, setField, errors, readOnly }) => {
				const selectedTeachers = extractSubjectUserIds(data.users).map(String);

				return (
					<Stack gap="sm">
						<TextInput
							label="Название"
							withAsterisk
							value={data.name ?? ''}
							error={errors.name}
							readOnly={readOnly}
							onChange={(event) => setField('name', event.currentTarget.value)}
						/>
						<NumberInput
							label="Сортировка"
							value={data.sort ?? 100}
							readOnly={readOnly}
							onChange={(value) => setField('sort', typeof value === 'number' ? value : 100)}
						/>
						<MultiSelect
							label="Учителя"
							data={teacherOptions}
							value={selectedTeachers}
							disabled={readOnly}
							onChange={(values) =>
								setField(
									'users',
									values.map((value) => ({ user_id: Number(value) })),
								)
							}
							searchable
							clearable
						/>
					</Stack>
				);
			}}
		</MainEntityForm>
	);
}
