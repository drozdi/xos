import { Card, Checkbox, Flex, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { mainUserApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowSize } from '@/core/windowManager';

import { toggleUserRole } from './userFormUtils';

interface UserRolesTabProps {
	roles: string[];
	readOnly: boolean;
	onRolesChange: (roles: string[]) => void;
}

function getExtraRolesColumns(windowWidth: number): number {
	if (windowWidth >= 768) {
		return 3;
	}
	if (windowWidth >= 480) {
		return 2;
	}
	return 1;
}

export function UserRolesTab({ roles, readOnly, onRolesChange }: UserRolesTabProps) {
	const { width: windowWidth } = useWindowSize();

	const roleOptionsQuery = useQuery({
		queryKey: queryKeys.main.userRoleOptions,
		queryFn: () => mainUserApi.roleOptions(),
	});

	const extraRoleOptions = roleOptionsQuery.data ?? [];

	if (roleOptionsQuery.isLoading) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Загрузка ролей…
			</Typography.Text>
		);
	}

	if (extraRoleOptions.length === 0) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Нет дополнительных ролей
			</Typography.Text>
		);
	}

	return (
		<Flex vertical gap={12}>
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Роли, не связанные с доступом к приложениям
			</Typography.Text>
			<div
				style={{
					display: 'grid',
					gap: 12,
					gridTemplateColumns: `repeat(${getExtraRolesColumns(windowWidth)}, minmax(0, 1fr))`,
				}}
			>
				{extraRoleOptions.map((role) => (
					<Card key={role} size="small" style={{ height: '100%' }}>
						<Checkbox
							checked={roles.includes(role)}
							disabled={readOnly}
							onChange={() => onRolesChange(toggleUserRole(roles, role))}
						>
							{role}
						</Checkbox>
					</Card>
				))}
			</div>
		</Flex>
	);
}
