import { Button, Card, Flex, Form, Select, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { mainGroupApi, type UserGroupItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates';
import { useWindowSize } from '@/core/windowManager';

import { addUserGroup, removeUserGroup, updateUserGroup } from './userFormUtils';

interface UserGroupsTabProps {
	groups: Record<string, UserGroupItem>;
	readOnly: boolean;
	onChange: (groups: Record<string, UserGroupItem>) => void;
}

function useTableLayout(windowWidth: number): boolean {
	return windowWidth >= 640;
}

interface UserGroupEntryProps {
	entryKey: string;
	group: UserGroupItem;
	groups: Record<string, UserGroupItem>;
	readOnly: boolean;
	onChange: (groups: Record<string, UserGroupItem>) => void;
}

function UserGroupCard({
	entryKey,
	group,
	groups,
	readOnly,
	onChange,
}: UserGroupEntryProps) {
	const label = group.name ?? `Группа #${group.group_id}`;

	return (
		<Card size="small">
			<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
				<Typography.Text strong>{label}</Typography.Text>
				{!readOnly ? (
					<Button
						type="text"
						danger
						aria-label="Удалить группу пользователя"
						icon={<DeleteOutlined style={{ fontSize: 16 }} />}
						onClick={() => onChange(removeUserGroup(groups, entryKey))}
					/>
				) : null}
			</Flex>
			<Flex vertical gap={8}>
				<DateTimeField
					label="С"
					value={group.activeFrom}
					readOnly={readOnly}
					onChange={(value) => onChange(updateUserGroup(groups, entryKey, { activeFrom: value }))}
				/>
				<DateTimeField
					label="По"
					value={group.activeTo}
					readOnly={readOnly}
					onChange={(value) => onChange(updateUserGroup(groups, entryKey, { activeTo: value }))}
				/>
			</Flex>
		</Card>
	);
}

export function UserGroupsTab({ groups, readOnly, onChange }: UserGroupsTabProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = useTableLayout(windowWidth);
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

	const groupSelectQuery = useQuery({
		queryKey: queryKeys.main.groups({ limit: -1, offset: 1, filters: { ou: -1 } }),
		queryFn: () => mainGroupApi.list({ limit: -1, offset: 1, filters: { ou: -1 } }),
		enabled: !readOnly,
	});

	const groupOptions = useMemo(
		() =>
			(groupSelectQuery.data?.items ?? []).map((group) => ({
				value: String(group.id),
				label: `${group.name} - ${group.code}`,
			})),
		[groupSelectQuery.data?.items],
	);

	const entries = useMemo(() => Object.entries(groups), [groups]);

	const handleAdd = () => {
		if (!selectedGroupId) {
			return;
		}
		const label =
			groupSelectQuery.data?.items.find((item) => item.id === selectedGroupId)?.name ?? '';
		onChange(addUserGroup(groups, selectedGroupId, label));
		setSelectedGroupId(null);
	};

	const columns = [
		{
			title: 'Группа',
			key: 'name',
			render: (_: unknown, row: { entryKey: string; group: UserGroupItem }) => (
				<Typography.Text strong style={{ fontSize: 13 }}>
					{row.group.name ?? `Группа #${row.group.group_id}`}
				</Typography.Text>
			),
		},
		{
			title: 'С',
			key: 'activeFrom',
			render: (_: unknown, row: { entryKey: string; group: UserGroupItem }) => (
				<DateTimeField
					label=""
					value={row.group.activeFrom}
					readOnly={readOnly}
					onChange={(value) =>
						onChange(updateUserGroup(groups, row.entryKey, { activeFrom: value }))
					}
				/>
			),
		},
		{
			title: 'По',
			key: 'activeTo',
			render: (_: unknown, row: { entryKey: string; group: UserGroupItem }) => (
				<DateTimeField
					label=""
					value={row.group.activeTo}
					readOnly={readOnly}
					onChange={(value) =>
						onChange(updateUserGroup(groups, row.entryKey, { activeTo: value }))
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
						render: (_: unknown, row: { entryKey: string; group: UserGroupItem }) => (
							<Button
								type="text"
								danger
								aria-label="Удалить группу пользователя"
								icon={<DeleteOutlined style={{ fontSize: 16 }} />}
								onClick={() => onChange(removeUserGroup(groups, row.entryKey))}
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
					<Form.Item label="Добавить группу" style={{ marginBottom: 0, flex: 1 }}>
						<Select
							options={groupOptions}
							value={selectedGroupId ? String(selectedGroupId) : undefined}
							onChange={(value) => setSelectedGroupId(value ? Number(value) : null)}
							showSearch
							allowClear
							optionFilterProp="label"
							notFoundContent={groupSelectQuery.isLoading ? 'Загрузка…' : 'Ничего не найдено'}
							style={{ width: '100%' }}
						/>
					</Form.Item>
					<Button type="primary" onClick={handleAdd} disabled={!selectedGroupId}>
						Добавить
					</Button>
				</Flex>
			) : null}

			{entries.length === 0 ? (
				<Typography.Text type="secondary" style={{ fontSize: 13 }}>
					Пользователь не состоит в группах
				</Typography.Text>
			) : isTableLayout ? (
				<Table
					size="small"
					pagination={false}
					rowKey="entryKey"
					dataSource={entries.map(([entryKey, group]) => ({ entryKey, group }))}
					columns={columns}
				/>
			) : (
				entries.map(([key, group]) => (
					<UserGroupCard
						key={key}
						entryKey={key}
						group={group}
						groups={groups}
						readOnly={readOnly}
						onChange={onChange}
					/>
				))
			)}
		</Flex>
	);
}
