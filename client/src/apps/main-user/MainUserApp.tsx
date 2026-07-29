import { Alert, Stack, Tabs, Text } from '@mantine/core';
import { useState } from 'react';

import { mainUserApi, type UserDetail } from '@/core/api/endpoints/mainApi';
import {
	canCreateMainUser,
	useCanAccessMainUser,
	useCanDeleteMainUser,
	useCanGroupMainUser,
	useCanReadMainUser,
	useCanRoleMainUser,
	useCanUpdateMainUser,
	useCanChangeMainUserPassword,
} from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';

import { UserAccessTab } from './UserAccessTab';
import { UserGeneralTab } from './UserGeneralTab';
import { UserGroupsTab } from './UserGroupsTab';
import { UserRolesTab } from './UserRolesTab';
import {
	normalizeUserAccesses,
	normalizeUserGroups,
	normalizeUserRoles,
	prepareUserSavePayload,
} from './userFormUtils';
import { validateUserForm } from './mainUserValidation';

const initialData: UserDetail = {
	id: 0,
	login: '',
	alias: '',
	email: '',
	first_name: '',
	second_name: '',
	patronymic: '',
	phone: '',
	description: '',
	active: true,
	ou_id: null,
	parent_id: null,
	activeFrom: null,
	activeTo: null,
	groups: {},
	accesses: {},
	roles: [],
	password: '',
	confirm_password: '',
};

export default function MainUserApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainUser();
	const canUpdate = useCanUpdateMainUser();
	const canDelete = useCanDeleteMainUser();
	const canGroup = useCanGroupMainUser();
	const canAccess = useCanAccessMainUser();
	const canRole = useCanRoleMainUser();
	const canChangePassword = useCanChangeMainUserPassword();
	const canCreate = canCreateMainUser();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');

	const canSave =
		(isNew ? canCreate : canUpdate) || canGroup || canAccess || canRole;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание пользователя
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр пользователя
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Пользователь"
			queryKey={['main', 'user']}
			listQueryKey={['main', 'users']}
			load={mainUserApi.get}
			save={mainUserApi.update}
			create={mainUserApi.create}
			remove={mainUserApi.remove}
			initialData={initialData}
			validate={validateUserForm}
			transformBeforeSave={prepareUserSavePayload}
			canSave={canSave}
			canDelete={canDelete}
			headerNote={({ data, isNew: isNewRecord }) => {
				if (isNewRecord) {
					return null;
				}

				const notes: string[] = [];
				if (data.x_timestamp) {
					notes.push(`Последнее обновление: ${String(data.x_timestamp)}`);
				}
				if (data.last_login) {
					notes.push(`Последний вход: ${data.last_login}`);
				}

				if (notes.length === 0) {
					return null;
				}

				return (
					<Stack gap={2}>
						{notes.map((note) => (
							<Text key={note} size="sm" c="dimmed">
								{note}
							</Text>
						))}
					</Stack>
				);
			}}
		>
			{({ data, setField, errors, isNew: isNewRecord }) => {
				const readOnlyGeneral = isNewRecord ? !canCreate : !canUpdate;
				const readOnlyGroups = !canGroup;
				const readOnlyAccess = !canAccess;
				const readOnlyRoles = !canRole;
				const groups = normalizeUserGroups(data.groups);
				const accesses = normalizeUserAccesses(data.accesses);
				const roles = normalizeUserRoles(data.roles);

				return (
					<Tabs value={activeTab} onChange={setActiveTab}>
						<Tabs.List>
							<Tabs.Tab value="general">Общие</Tabs.Tab>
							<Tabs.Tab value="groups">Группы</Tabs.Tab>
							{canAccess ? (
								<Tabs.Tab value="app-access">Доступ к приложениям</Tabs.Tab>
							) : null}
							{canRole ? (
								<Tabs.Tab value="extra-roles">Дополнительные роли</Tabs.Tab>
							) : null}
						</Tabs.List>

						<Tabs.Panel value="general" pt="sm">
							<UserGeneralTab
								data={data}
								errors={errors}
								readOnly={readOnlyGeneral}
								canChangePassword={canChangePassword}
								setField={setField}
							/>
						</Tabs.Panel>

						<Tabs.Panel value="groups" pt="sm">
							<UserGroupsTab
								groups={groups}
								readOnly={readOnlyGroups}
								onChange={(nextGroups) => setField('groups', nextGroups)}
							/>
						</Tabs.Panel>

						{canAccess ? (
							<Tabs.Panel value="app-access" pt="sm">
								<UserAccessTab
									accesses={accesses}
									roles={roles}
									readOnly={readOnlyAccess}
									onAccessesChange={(nextAccesses) => setField('accesses', nextAccesses)}
									onRolesChange={(nextRoles) => setField('roles', nextRoles)}
								/>
							</Tabs.Panel>
						) : null}

						{canRole ? (
							<Tabs.Panel value="extra-roles" pt="sm">
								<UserRolesTab
									roles={roles}
									readOnly={readOnlyRoles}
									onRolesChange={(nextRoles) => setField('roles', nextRoles)}
								/>
							</Tabs.Panel>
						) : null}
					</Tabs>
				);
			}}
		</MainEntityForm>
	);
}
