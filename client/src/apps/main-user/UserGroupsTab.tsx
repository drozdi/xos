import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import { mainGroupApi, type UserGroupItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates';
import { useAuthStore } from '@/core/auth/authStore';
import { useWindowSize } from '@/core/windowManager';

import { addUserGroup, removeUserGroup, updateUserGroup } from './userFormUtils';

interface UserGroupsTabProps {
	groups: Record<string, UserGroupItem>;
	ouId?: number | null;
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
	layout: 'table' | 'card';
	onChange: (groups: Record<string, UserGroupItem>) => void;
}

function UserGroupEntry({
	entryKey,
	group,
	groups,
	readOnly,
	layout,
	onChange,
}: UserGroupEntryProps) {
	const label = group.name ?? `Группа #${group.group_id}`;

	const removeButton = !readOnly ? (
		<ActionIcon
			variant="subtle"
			color="red"
			aria-label="Удалить группу пользователя"
			onClick={() => onChange(removeUserGroup(groups, entryKey))}
		>
			<IconTrash size={16} />
		</ActionIcon>
	) : null;

	const activeFromField = (
		<DateTimeField
			label="С"
			value={group.activeFrom}
			readOnly={readOnly}
			onChange={(value) => onChange(updateUserGroup(groups, entryKey, { activeFrom: value }))}
		/>
	);

	const activeToField = (
		<DateTimeField
			label="По"
			value={group.activeTo}
			readOnly={readOnly}
			onChange={(value) => onChange(updateUserGroup(groups, entryKey, { activeTo: value }))}
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

export function UserGroupsTab({ groups, ouId, readOnly, onChange }: UserGroupsTabProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = useTableLayout(windowWidth);
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const resolvedOuId = ouId && ouId > 0 ? ouId : null;
	const groupsEnabled = isAuthenticated && resolvedOuId !== null && !readOnly;

	const listRequest = useMemo(
		() => ({
			limit: -1,
			offset: 1,
			filters: { ou: resolvedOuId },
		}),
		[resolvedOuId],
	);

	const groupSelectQuery = useQuery({
		queryKey: queryKeys.main.groups(listRequest),
		queryFn: () => mainGroupApi.list(listRequest),
		enabled: groupsEnabled,
	});

	useEffect(() => {
		setSelectedGroupId(null);
	}, [resolvedOuId]);

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

	const layout = isTableLayout ? 'table' : 'card';

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Group align="flex-end" wrap="nowrap">
					<Select
						label="Добавить группу"
						data={groupOptions}
						value={selectedGroupId ? String(selectedGroupId) : null}
						onChange={(value) => setSelectedGroupId(value ? Number(value) : null)}
						searchable
						clearable
						disabled={!groupsEnabled}
						nothingFoundMessage={
							!resolvedOuId
								? 'Сначала выберите подразделение'
								: groupSelectQuery.isLoading
									? 'Загрузка…'
									: 'Нет групп в этом подразделении'
						}
					/>
					<Button onClick={handleAdd} disabled={!selectedGroupId}>
						Добавить
					</Button>
				</Group>
			) : null}

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Пользователь не состоит в группах
				</Text>
			) : isTableLayout ? (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Группа</Table.Th>
							<Table.Th>С</Table.Th>
							<Table.Th>По</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, group]) => (
							<UserGroupEntry
								key={key}
								entryKey={key}
								group={group}
								groups={groups}
								readOnly={readOnly}
								layout={layout}
								onChange={onChange}
							/>
						))}
					</Table.Tbody>
				</Table>
			) : (
				entries.map(([key, group]) => (
					<UserGroupEntry
						key={key}
						entryKey={key}
						group={group}
						groups={groups}
						readOnly={readOnly}
						layout={layout}
						onChange={onChange}
					/>
				))
			)}
		</Stack>
	);
}
