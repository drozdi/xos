import { ActionIcon, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { mainUserApi, type GroupUserItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates';
import { UserSelect } from '@/features/main/UserSelect';

import { addGroupUser, removeGroupUser, updateGroupUser } from './groupFormUtils';

interface GroupUsersTabProps {
	users: Record<string, GroupUserItem>;
	ouId?: number | null;
	readOnly: boolean;
	onChange: (users: Record<string, GroupUserItem>) => void;
}

export function GroupUsersTab({ users, ouId, readOnly, onChange }: GroupUsersTabProps) {
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

	const userSelectQuery = useQuery({
		queryKey: queryKeys.main.userSelect(ouId ? { ou: ouId } : undefined),
		queryFn: () => mainUserApi.select({ filters: ouId ? { ou: ouId } : undefined }),
		enabled: Boolean(ouId) && !readOnly,
	});

	const entries = useMemo(() => Object.entries(users), [users]);

	const handleAdd = () => {
		if (!selectedUserId) {
			return;
		}
		const label =
			userSelectQuery.data?.items.find((item) => item.value === selectedUserId)?.label ?? '';
		onChange(addGroupUser(users, selectedUserId, label));
		setSelectedUserId(null);
	};

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Group align="flex-end" wrap="nowrap">
					<UserSelect
						label="Добавить пользователя"
						value={selectedUserId}
						filters={ouId ? { ou: ouId } : undefined}
						disabled={!ouId}
						onChange={(userId) => setSelectedUserId(userId)}
					/>
					<Button onClick={handleAdd} disabled={!selectedUserId}>
						Добавить
					</Button>
				</Group>
			) : null}

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					В группе нет пользователей
				</Text>
			) : (
				entries.map(([key, user]) => (
					<Paper key={key} withBorder p="sm">
						<Group justify="space-between" align="flex-start" mb="xs">
							<Text fw={500}>{user.name ?? `Пользователь #${user.user_id}`}</Text>
							{!readOnly ? (
								<ActionIcon
									variant="subtle"
									color="red"
									aria-label="Удалить пользователя из группы"
									onClick={() => onChange(removeGroupUser(users, key))}
								>
									<IconTrash size={16} />
								</ActionIcon>
							) : null}
						</Group>
						<Stack gap="xs">
							<DateTimeField
								label="С"
								value={user.activeFrom}
								readOnly={readOnly}
								onChange={(value) =>
									onChange(updateGroupUser(users, key, { activeFrom: value }))
								}
							/>
							<DateTimeField
								label="По"
								value={user.activeTo}
								readOnly={readOnly}
								onChange={(value) =>
									onChange(updateGroupUser(users, key, { activeTo: value }))
								}
							/>
						</Stack>
					</Paper>
				))
			)}
		</Stack>
	);
}
