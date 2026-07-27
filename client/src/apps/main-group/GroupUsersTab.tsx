import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { mainUserApi, type GroupUserItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates';
import { UserSelect } from '@/features/main/UserSelect';
import { useWindowSize } from '@/core/windowManager';

import { addGroupUser, removeGroupUser, updateGroupUser } from './groupFormUtils';

interface GroupUsersTabProps {
	users: Record<string, GroupUserItem>;
	readOnly: boolean;
	onChange: (users: Record<string, GroupUserItem>) => void;
}

function useTableLayout(windowWidth: number): boolean {
	return windowWidth >= 640;
}

interface GroupUserEntryProps {
	entryKey: string;
	user: GroupUserItem;
	users: Record<string, GroupUserItem>;
	readOnly: boolean;
	layout: 'table' | 'card';
	onChange: (users: Record<string, GroupUserItem>) => void;
}

function GroupUserEntry({
	entryKey,
	user,
	users,
	readOnly,
	layout,
	onChange,
}: GroupUserEntryProps) {
	const label = user.name ?? `Пользователь #${user.user_id}`;

	const removeButton = !readOnly ? (
		<ActionIcon
			variant="subtle"
			color="red"
			aria-label="Удалить пользователя из группы"
			onClick={() => onChange(removeGroupUser(users, entryKey))}
		>
			<IconTrash size={16} />
		</ActionIcon>
	) : null;

	const activeFromField = (
		<DateTimeField
			label="С"
			value={user.activeFrom}
			readOnly={readOnly}
			onChange={(value) => onChange(updateGroupUser(users, entryKey, { activeFrom: value }))}
		/>
	);

	const activeToField = (
		<DateTimeField
			label="По"
			value={user.activeTo}
			readOnly={readOnly}
			onChange={(value) => onChange(updateGroupUser(users, entryKey, { activeTo: value }))}
		/>
	);

	if (layout === 'table') {
		return (
			<Table.Tr>
				<Table.Td>
					<Text fw={500} size="sm">
						{label}
					</Text>
				</Table.Td>
				<Table.Td>{activeFromField}</Table.Td>
				<Table.Td>{activeToField}</Table.Td>
				{!readOnly ? <Table.Td w={48}>{removeButton}</Table.Td> : null}
			</Table.Tr>
		);
	}

	return (
		<Paper withBorder p="sm">
			<Group justify="space-between" align="flex-start" mb="xs">
				<Text fw={500}>{label}</Text>
				{removeButton}
			</Group>
			<Stack gap="xs">
				{activeFromField}
				{activeToField}
			</Stack>
		</Paper>
	);
}

export function GroupUsersTab({ users, readOnly, onChange }: GroupUsersTabProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = useTableLayout(windowWidth);
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

	const userSelectQuery = useQuery({
		queryKey: queryKeys.main.userSelect(undefined),
		queryFn: () => mainUserApi.select({}),
		enabled: !readOnly,
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

	const layout = isTableLayout ? 'table' : 'card';

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Group align="flex-end" wrap="nowrap">
					<UserSelect
						label="Добавить пользователя"
						value={selectedUserId}
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
			) : isTableLayout ? (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Пользователь</Table.Th>
							<Table.Th>С</Table.Th>
							<Table.Th>По</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, user]) => (
							<GroupUserEntry
								key={key}
								entryKey={key}
								user={user}
								users={users}
								readOnly={readOnly}
								layout={layout}
								onChange={onChange}
							/>
						))}
					</Table.Tbody>
				</Table>
			) : (
				entries.map(([key, user]) => (
					<GroupUserEntry
						key={key}
						entryKey={key}
						user={user}
						users={users}
						readOnly={readOnly}
						layout={layout}
						onChange={onChange}
					/>
				))
			)}
		</Stack>
	);
}
