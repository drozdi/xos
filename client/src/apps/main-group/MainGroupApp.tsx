import { Alert, Tabs, Text } from '@mantine/core';
import { useState } from 'react';

import { mainGroupApi, type GroupDetail } from '@/core/api/endpoints/mainApi';
import {
	canCreateMainGroup,
	useCanAccessMainGroup,
	useCanDeleteMainGroup,
	useCanReadMainGroup,
	useCanUpdateMainGroup,
	useCanUserMainGroup,
} from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';

import { GroupAccessTab } from './GroupAccessTab';
import { GroupGeneralTab } from './GroupGeneralTab';
import { GroupUsersTab } from './GroupUsersTab';
import { normalizeGroupUsers, prepareGroupSavePayload } from './groupFormUtils';
import { validateGroupForm } from './mainGroupValidation';

const initialData: GroupDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	active: true,
	anonymous: false,
	ou_id: null,
	parent_id: null,
	user_id: null,
	activeFrom: null,
	activeTo: null,
	users: {},
	accesses: {},
};

export default function MainGroupApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainGroup();
	const canUpdate = useCanUpdateMainGroup();
	const canDelete = useCanDeleteMainGroup();
	const canUser = useCanUserMainGroup();
	const canAccess = useCanAccessMainGroup();
	const canCreate = canCreateMainGroup();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave =
		(isNew ? canCreate : canUpdate) || canUser || canAccess;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание группы
			</Alert>
		);
	}

	if (!isNew && !canRead) {
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
			transformBeforeSave={prepareGroupSavePayload}
			canSave={canSave}
			canDelete={canDelete}
			headerNote={({ data, isNew: isNewRecord }) =>
				!isNewRecord && data.x_timestamp ? (
					<Text size="sm" c="dimmed">
						Последнее обновление: {String(data.x_timestamp)}
					</Text>
				) : null
			}
		>
			{({ data, setField, errors, isNew: isNewRecord }) => {
				const readOnlyGeneral = isNewRecord ? !canCreate : !canUpdate;
				const readOnlyUsers = !canUser;
				const readOnlyAccess = !canAccess;
				const users = normalizeGroupUsers(data.users);
				const accesses = data.accesses ?? {};

				return (
					<Tabs value={activeTab} onChange={setActiveTab}>
						<Tabs.List>
							<Tabs.Tab value="general">Общие</Tabs.Tab>
							<Tabs.Tab value="users">Пользователи</Tabs.Tab>
							<Tabs.Tab value="access">Права</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value="general" pt="sm">
							<GroupGeneralTab
								data={data}
								errors={errors}
								readOnly={readOnlyGeneral}
								entityId={entityId}
								setField={setField}
							/>
						</Tabs.Panel>

						<Tabs.Panel value="users" pt="sm">
							<GroupUsersTab
								users={users}
								readOnly={readOnlyUsers}
								onChange={(nextUsers) => setField('users', nextUsers)}
							/>
						</Tabs.Panel>

						<Tabs.Panel value="access" pt="sm">
							<GroupAccessTab
								accesses={accesses}
								readOnly={readOnlyAccess}
								onChange={(nextAccesses) => setField('accesses', nextAccesses)}
							/>
						</Tabs.Panel>
					</Tabs>
				);
			}}
		</MainEntityForm>
	);
}
