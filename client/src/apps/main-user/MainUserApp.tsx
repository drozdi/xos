import { Alert, Flex, Tabs, Typography } from 'antd';
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
};

export default function MainUserApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainUser();
	const canUpdate = useCanUpdateMainUser();
	const canDelete = useCanDeleteMainUser();
	const canGroup = useCanGroupMainUser();
	const canAccess = useCanAccessMainUser();
	const canRole = useCanRoleMainUser();
	const canCreate = canCreateMainUser();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState('general');

	const canSave =
		(isNew ? canCreate : canUpdate) || canGroup || canAccess || canRole;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание пользователя"
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
				description="Нет прав на просмотр пользователя"
				style={{ margin: 16 }}
			/>
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
					<Flex vertical gap={2}>
						{notes.map((note) => (
							<Typography.Text key={note} type="secondary" style={{ fontSize: 13 }}>
								{note}
							</Typography.Text>
						))}
					</Flex>
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

				const items = [
					{
						key: 'general',
						label: 'Общие',
						children: (
							<UserGeneralTab
								data={data}
								errors={errors}
								readOnly={readOnlyGeneral}
								setField={setField}
							/>
						),
					},
					{
						key: 'groups',
						label: 'Группы',
						children: (
							<UserGroupsTab
								groups={groups}
								readOnly={readOnlyGroups}
								onChange={(nextGroups) => setField('groups', nextGroups)}
							/>
						),
					},
				];

				if (canAccess) {
					items.push({
						key: 'app-access',
						label: 'Доступ к приложениям',
						children: (
							<UserAccessTab
								accesses={accesses}
								roles={roles}
								readOnly={readOnlyAccess}
								onAccessesChange={(nextAccesses) => setField('accesses', nextAccesses)}
								onRolesChange={(nextRoles) => setField('roles', nextRoles)}
							/>
						),
					});
				}

				if (canRole) {
					items.push({
						key: 'extra-roles',
						label: 'Дополнительные роли',
						children: (
							<UserRolesTab
								roles={roles}
								readOnly={readOnlyRoles}
								onRolesChange={(nextRoles) => setField('roles', nextRoles)}
							/>
						),
					});
				}

				return <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />;
			}}
		</MainEntityForm>
	);
}
