import { Checkbox, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
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
			<Text size="sm" c="dimmed">
				Загрузка ролей…
			</Text>
		);
	}

	if (extraRoleOptions.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет дополнительных ролей
			</Text>
		);
	}

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				Роли, не связанные с доступом к приложениям
			</Text>
			<SimpleGrid cols={getExtraRolesColumns(windowWidth)}>
				{extraRoleOptions.map((role) => (
					<Paper key={role} withBorder p="sm" h="100%">
						<Checkbox
							label={role}
							checked={roles.includes(role)}
							disabled={readOnly}
							onChange={() => onRolesChange(toggleUserRole(roles, role))}
						/>
					</Paper>
				))}
			</SimpleGrid>
		</Stack>
	);
}
