import { Button, Group, MultiSelect, Select, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sambaApi } from '@/core/api/endpoints/sambaApi';
import { mainGroupApi, mainOuApi, mainUserApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';

const USER_FIELDS: Array<[string, string]> = [
	['first_name', 'Имя'],
	['second_name', 'Фамилия'],
	['patronymic', 'Отчество'],
	['alias', 'Псевдоним'],
	['email', 'Почта'],
	['phone', 'Телефон'],
	['description', 'Описание'],
];

const GROUP_FIELDS: Array<[string, string]> = [
	['name', 'Название'],
	['description', 'Описание'],
];

const USER_TARGETS: Array<[string, string]> = [
	['givenName', 'Имя'],
	['sn', 'Фамилия'],
	['displayName', 'Отображаемое имя'],
	['description', 'Описание'],
	['mail', 'Почта'],
	['telephoneNumber', 'Телефон'],
	['title', 'Должность'],
	['department', 'Отдел'],
	['company', 'Компания'],
	['physicalDeliveryOfficeName', 'Кабинет'],
];

const GROUP_TARGETS: Array<[string, string]> = [['description', 'Описание']];

function options(fields: Array<[string, string]>) {
	return [{ value: '', label: 'Не переносить' }, ...fields.map(([value, label]) => ({ value, label }))];
}

export function ImportTab({
	serverId,
	ready,
}: {
	serverId: number;
	ready: boolean;
}) {
	const queryClient = useQueryClient();
	const mapQuery = useQuery({
		queryKey: queryKeys.samba.importMap(serverId),
		queryFn: () => sambaApi.importMap(serverId),
	});
	const ouQuery = useQuery({
		queryKey: ['main', 'ou', 'select'],
		queryFn: () => mainOuApi.select(),
	});
	const [userMap, setUserMap] = useState<Record<string, string>>({});
	const [groupMap, setGroupMap] = useState<Record<string, string>>({});
	const [mainOus, setMainOus] = useState<string[]>([]);
	const [ouIds, setOuIds] = useState<string[]>([]);
	const [userIds, setUserIds] = useState<string[]>([]);
	const [groupIds, setGroupIds] = useState<string[]>([]);
	const [filledKey, setFilledKey] = useState('');
	const [note, setNote] = useState<string | null>(null);
	const poolKey = [...mainOus].sort().join(',');
	const pool = useQuery({
		queryKey: ['samba', 'import-pool', serverId, poolKey],
		enabled: mainOus.length > 0,
		queryFn: async () => {
			const pairs = await Promise.all(
				mainOus.map(async (ou) => {
					const id = Number(ou);
					const [users, groups] = await Promise.all([
						mainUserApi.list({ filters: { ou: id }, limit: -1, offset: 1 }),
						mainGroupApi.list({ filters: { ou: id }, limit: -1, offset: 1 }),
					]);
					return { ouId: id, users: users.items, groups: groups.items };
				}),
			);
			const users = new Map<number, { id: number; login: string; alias: string; domain?: boolean; ou_id: number }>();
			const groups = new Map<number, { id: number; code: string; name: string; domain?: boolean; ou_id: number }>();
			for (const pair of pairs) {
				for (const user of pair.users) {
					users.set(user.id, {
						id: user.id,
						login: user.login,
						alias: user.alias,
						domain: user.domain,
						ou_id: pair.ouId,
					});
				}
				for (const group of pair.groups) {
					groups.set(group.id, {
						id: group.id,
						code: group.code,
						name: group.name,
						domain: group.domain,
						ou_id: group.ou_id ?? pair.ouId,
					});
				}
			}
			return { users: [...users.values()], groups: [...groups.values()] };
		},
	});

	useEffect(() => {
		if (!mapQuery.data) {
			return;
		}
		setUserMap(mapQuery.data.user);
		setGroupMap(mapQuery.data.group);
	}, [mapQuery.data]);

	useEffect(() => {
		if (!pool.isSuccess || pool.isFetching || !pool.data || filledKey === poolKey) {
			return;
		}
		const markedOus = mainOus.filter((id) =>
			(ouQuery.data?.items ?? []).some((item) => String(item.value) === id && item.domain),
		);
		const keep = new Set(markedOus);
		setOuIds(markedOus);
		setUserIds(
			pool.data.users
				.filter((item) => item.domain && keep.has(String(item.ou_id)))
				.map((item) => String(item.id)),
		);
		setGroupIds(
			pool.data.groups
				.filter((item) => item.domain && keep.has(String(item.ou_id)))
				.map((item) => String(item.id)),
		);
		setFilledKey(poolKey);
	}, [pool.data, pool.isFetching, pool.isSuccess, poolKey, filledKey, mainOus, ouQuery.data]);

	const save = useMutation({
		mutationFn: () => sambaApi.saveImportMap(serverId, { user: userMap, group: groupMap }),
		onSuccess: async (saved) => {
			setUserMap(saved.user);
			setGroupMap(saved.group);
			await queryClient.invalidateQueries({ queryKey: queryKeys.samba.importMap(serverId) });
			setNote('Правила сохранены');
		},
		onError: (reason: unknown) => setNote(extractApiErrorMessage(reason)),
	});

	const carried = new Set(ouIds);
	const visibleUsers = (pool.data?.users ?? []).filter((item) => carried.has(String(item.ou_id)));
	const visibleGroups = (pool.data?.groups ?? []).filter((item) => carried.has(String(item.ou_id)));

	const run = useMutation({
		mutationFn: () =>
			sambaApi.importFromMain(serverId, {
				ou_ids: ouIds.map(Number),
				user_ids: userIds.map(Number),
				group_ids: groupIds.map(Number),
				seen_user_ids: visibleUsers.map((item) => item.id),
				seen_group_ids: visibleGroups.map((item) => item.id),
				seen_ou_ids: mainOus.map(Number),
			}),
		onSuccess: (result) => {
			const lines = [`Поставлено команд: ${result.queued}`];
			if (result.skipped.length > 0) {
				lines.push(...result.skipped);
			}
			setNote(lines.join('\n'));
		},
		onError: (reason: unknown) => setNote(extractApiErrorMessage(reason)),
	});

	return (
		<Stack gap="sm" maw={720}>
			<Text size="sm">
				Подразделение, группа и пользователь переносятся, если включено «В домене». Снятое подразделение забирает с собой своих пользователей и группы. Пароль новой учётки равен логину.
			</Text>
			<MultiSelect
				label="Подразделения main"
				data={(ouQuery.data?.items ?? []).map((item) => ({ value: String(item.value), label: item.label }))}
				value={mainOus}
				onChange={(value) => {
					setMainOus(value);
					setOuIds(value);
					setUserIds([]);
					setGroupIds([]);
					setFilledKey('');
				}}
				searchable
				clearable
			/>
			<MultiSelect
				label="Переносить подразделения"
				description="Снятое подразделение не создаётся, его пользователи и группы тоже"
				data={mainOus.map((id) => ({
					value: id,
					label: (ouQuery.data?.items ?? []).find((item) => String(item.value) === id)?.label ?? id,
				}))}
				value={ouIds}
				onChange={(value) => {
					const keep = new Set(value);
					const added = value.filter((id) => !ouIds.includes(id));
					setOuIds(value);
					setUserIds((current) => {
						const stayed = current.filter((id) => {
							const row = pool.data?.users.find((item) => String(item.id) === id);
							return row ? keep.has(String(row.ou_id)) : false;
						});
						const extra = (pool.data?.users ?? [])
							.filter((item) => item.domain && added.includes(String(item.ou_id)))
							.map((item) => String(item.id));
						return [...new Set([...stayed, ...extra])];
					});
					setGroupIds((current) => {
						const stayed = current.filter((id) => {
							const row = pool.data?.groups.find((item) => String(item.id) === id);
							return row ? keep.has(String(row.ou_id)) : false;
						});
						const extra = (pool.data?.groups ?? [])
							.filter((item) => item.domain && added.includes(String(item.ou_id)))
							.map((item) => String(item.id));
						return [...new Set([...stayed, ...extra])];
					});
				}}
				searchable
				clearable
			/>
			<MultiSelect
				label="Пользователи"
				description="Только из переносимых подразделений. Отмечены те, у кого включено «В домене»."
				data={visibleUsers.map((item) => ({
					value: String(item.id),
					label: item.alias ? `${item.alias} · ${item.login}` : item.login,
				}))}
				value={userIds}
				onChange={setUserIds}
				searchable
				clearable
				disabled={mainOus.length === 0}
			/>
			<MultiSelect
				label="Группы"
				description="Только из переносимых подразделений. Отмечены те, у кого включено «В домене»."
				data={visibleGroups.map((item) => ({
					value: String(item.id),
					label: item.name ? `${item.name} · ${item.code}` : item.code,
				}))}
				value={groupIds}
				onChange={setGroupIds}
				searchable
				clearable
				disabled={mainOus.length === 0}
			/>
			<Text fw={600}>Пользователь</Text>
			<Text size="sm">Имя учётки: логин</Text>
			{USER_TARGETS.map(([target, label]) => (
				<Select
					key={target}
					label={label}
					data={options(USER_FIELDS)}
					value={userMap[target] ?? ''}
					onChange={(value) => setUserMap((current) => ({ ...current, [target]: value ?? '' }))}
				/>
			))}
			<Text fw={600}>Группа</Text>
			<Text size="sm">Имя группы: код</Text>
			{GROUP_TARGETS.map(([target, label]) => (
				<Select
					key={target}
					label={label}
					data={options(GROUP_FIELDS)}
					value={groupMap[target] ?? ''}
					onChange={(value) => setGroupMap((current) => ({ ...current, [target]: value ?? '' }))}
				/>
			))}
			<Group>
				<Button variant="light" loading={save.isPending} onClick={() => save.mutate()}>
					Сохранить правила
				</Button>
				<Button
					loading={run.isPending}
					disabled={!ready || pool.isFetching || (ouIds.length === 0 && userIds.length === 0 && groupIds.length === 0)}
					onClick={() => run.mutate()}
				>
					Импортировать
				</Button>
			</Group>
			{mapQuery.isError ? <Text c="red" size="sm">{extractApiErrorMessage(mapQuery.error)}</Text> : null}
			{pool.isError ? <Text c="red" size="sm">{extractApiErrorMessage(pool.error)}</Text> : null}
			{note ? <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{note}</Text> : null}
		</Stack>
	);
}
