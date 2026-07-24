import { Alert, Tabs, Typography } from 'antd';
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
	const [activeTab, setActiveTab] = useState('general');

	const canSave =
		(isNew ? canCreate : canUpdate) || canUser || canAccess;

	if (isNew && !canCreate) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание группы"
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
				description="Нет прав на просмотр группы"
				style={{ margin: 16 }}
			/>
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
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						Последнее обновление: {String(data.x_timestamp)}
					</Typography.Text>
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
					<Tabs
						activeKey={activeTab}
						onChange={setActiveTab}
						items={[
							{
								key: 'general',
								label: 'Общие',
								children: (
									<GroupGeneralTab
										data={data}
										errors={errors}
										readOnly={readOnlyGeneral}
										entityId={entityId}
										setField={setField}
									/>
								),
							},
							{
								key: 'users',
								label: 'Пользователи',
								children: (
									<GroupUsersTab
										users={users}
										readOnly={readOnlyUsers}
										onChange={(nextUsers) => setField('users', nextUsers)}
									/>
								),
							},
							{
								key: 'access',
								label: 'Права',
								children: (
									<GroupAccessTab
										accesses={accesses}
										readOnly={readOnlyAccess}
										onChange={(nextAccesses) => setField('accesses', nextAccesses)}
									/>
								),
							},
						]}
					/>
				);
			}}
		</MainEntityForm>
	);
}
