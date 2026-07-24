import { Button, Card, Flex, Table, Typography } from 'antd';
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
	onChange: (users: Record<string, GroupUserItem>) => void;
}

function GroupUserCard({
	entryKey,
	user,
	users,
	readOnly,
	onChange,
}: GroupUserEntryProps) {
	const label = user.name ?? `Пользователь #${user.user_id}`;

	return (
		<Card size="small">
			<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
				<Typography.Text strong>{label}</Typography.Text>
				{!readOnly ? (
					<Button
						type="text"
						danger
						aria-label="Удалить пользователя из группы"
						icon={<IconTrash size={16} />}
						onClick={() => onChange(removeGroupUser(users, entryKey))}
					/>
				) : null}
			</Flex>
			<Flex vertical gap={8}>
				<DateTimeField
					label="С"
					value={user.activeFrom}
					readOnly={readOnly}
					onChange={(value) => onChange(updateGroupUser(users, entryKey, { activeFrom: value }))}
				/>
				<DateTimeField
					label="По"
					value={user.activeTo}
					readOnly={readOnly}
					onChange={(value) => onChange(updateGroupUser(users, entryKey, { activeTo: value }))}
				/>
			</Flex>
		</Card>
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

	const columns = [
		{
			title: 'Пользователь',
			key: 'name',
			render: (_: unknown, row: { entryKey: string; user: GroupUserItem }) => (
				<Typography.Text strong style={{ fontSize: 13 }}>
					{row.user.name ?? `Пользователь #${row.user.user_id}`}
				</Typography.Text>
			),
		},
		{
			title: 'С',
			key: 'activeFrom',
			render: (_: unknown, row: { entryKey: string; user: GroupUserItem }) => (
				<DateTimeField
					label=""
					value={row.user.activeFrom}
					readOnly={readOnly}
					onChange={(value) =>
						onChange(updateGroupUser(users, row.entryKey, { activeFrom: value }))
					}
				/>
			),
		},
		{
			title: 'По',
			key: 'activeTo',
			render: (_: unknown, row: { entryKey: string; user: GroupUserItem }) => (
				<DateTimeField
					label=""
					value={row.user.activeTo}
					readOnly={readOnly}
					onChange={(value) =>
						onChange(updateGroupUser(users, row.entryKey, { activeTo: value }))
					}
				/>
			),
		},
		...(!readOnly
			? [
					{
						title: '',
						key: 'actions',
						width: 48,
						render: (_: unknown, row: { entryKey: string; user: GroupUserItem }) => (
							<Button
								type="text"
								danger
								aria-label="Удалить пользователя из группы"
								icon={<IconTrash size={16} />}
								onClick={() => onChange(removeGroupUser(users, row.entryKey))}
							/>
						),
					},
				]
			: []),
	];

	return (
		<Flex vertical gap={12}>
			{!readOnly ? (
				<Flex align="flex-end" gap={8} wrap="nowrap">
					<div style={{ flex: 1 }}>
						<UserSelect
							label="Добавить пользователя"
							value={selectedUserId}
							onChange={(userId) => setSelectedUserId(userId)}
						/>
					</div>
					<Button type="primary" onClick={handleAdd} disabled={!selectedUserId}>
						Добавить
					</Button>
				</Flex>
			) : null}

			{entries.length === 0 ? (
				<Typography.Text type="secondary" style={{ fontSize: 13 }}>
					В группе нет пользователей
				</Typography.Text>
			) : isTableLayout ? (
				<Table
					size="small"
					pagination={false}
					rowKey="entryKey"
					dataSource={entries.map(([entryKey, user]) => ({ entryKey, user }))}
					columns={columns}
				/>
			) : (
				entries.map(([key, user]) => (
					<GroupUserCard
						key={key}
						entryKey={key}
						user={user}
						users={users}
						readOnly={readOnly}
						onChange={onChange}
					/>
				))
			)}
		</Flex>
	);
}
