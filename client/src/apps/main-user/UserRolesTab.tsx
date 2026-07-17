import { Checkbox, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { mainUserApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowSize } from '@/core/windowManager';

import { toggleUserRole } from './userFormUtils';

interface UserRolesTabProps {
	roles: string[];
	readOnly: boolean;
	onChange: (roles: string[]) => void;
}

function getRolesTabColumns(windowWidth: number): number {
	if (windowWidth >= 768) {
		return 3;
	}
	if (windowWidth >= 480) {
		return 2;
	}
	return 1;
}

export function UserRolesTab({ roles, readOnly, onChange }: UserRolesTabProps) {
	const { width: windowWidth } = useWindowSize();
	const columns = getRolesTabColumns(windowWidth);

	const roleOptionsQuery = useQuery({
		queryKey: queryKeys.main.userRoleOptions,
		queryFn: () => mainUserApi.roleOptions(),
	});

	const options = roleOptionsQuery.data ?? [];

	const cards = useMemo(
		() =>
			options.map((role) => (
				<Paper key={role} withBorder p="sm" h="100%">
					<Checkbox
						label={role}
						checked={roles.includes(role)}
						disabled={readOnly}
						onChange={() => onChange(toggleUserRole(roles, role))}
					/>
				</Paper>
			)),
		[onChange, options, readOnly, roles],
	);

	if (roleOptionsQuery.isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка ролей…
			</Text>
		);
	}

	if (options.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет доступных ролей
			</Text>
		);
	}

	return <SimpleGrid cols={columns}>{cards}</SimpleGrid>;
}
