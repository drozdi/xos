import { Button, Group, Stack, Tabs, Text, TextInput, UnstyledButton } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sambaApi, type SambaServer } from '@/core/api/endpoints/sambaApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAppManager } from '@/core/appManager/useAppManager';
import { confirmAction } from '@/core/confirm';

import { runCommand } from './domainCommand';

export type DomainEntry = { name: string; cn?: string; dn: string; displayName?: string; description?: string };

export type DomainTree = {
	ous: DomainEntry[];
	users: Array<DomainEntry & { enabled: boolean }>;
	groups: Array<DomainEntry & { members: string[] }>;
	truncated?: boolean;
};

type Node = { dn: string; label: string; children: Node[] };
type Kind = 'user' | 'group' | 'ou';

function parentDn(dn: string): string {
	const comma = dn.indexOf(',');
	return comma >= 0 ? dn.slice(comma + 1) : '';
}

function labelOf(dn: string, ous: DomainEntry[]): string {
	const found = ous.find((item) => item.dn.toLowerCase() === dn.toLowerCase());
	if (found?.cn || found?.name) {
		return found.cn || found.name;
	}
	const match = /^(?:OU|CN)=([^,]+)/i.exec(dn);
	return match?.[1] ?? dn;
}

function buildOuNodes(tree: DomainTree): Node[] {
	const dns = new Set<string>();
	for (const ou of tree.ous) {
		if (!ou.dn) {
			continue;
		}
		let current = ou.dn;
		while (current) {
			dns.add(current);
			current = parentDn(current);
		}
	}
	if (dns.size === 0) {
		for (const item of [...tree.users, ...tree.groups]) {
			const parent = item.dn ? parentDn(item.dn) : '';
			if (parent) {
				dns.add(parent);
			}
		}
	}
	const nodes = new Map<string, Node>();
	for (const dn of dns) {
		nodes.set(dn.toLowerCase(), { dn, label: labelOf(dn, tree.ous), children: [] });
	}
	const roots: Node[] = [];
	for (const node of nodes.values()) {
		const parent = nodes.get(parentDn(node.dn).toLowerCase());
		if (parent && parent.dn.toLowerCase() !== node.dn.toLowerCase()) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}
	const sortNodes = (list: Node[]) => {
		list.sort((left, right) => left.label.localeCompare(right.label, 'ru'));
		list.forEach((item) => sortNodes(item.children));
	};
	sortNodes(roots);
	return roots;
}

function matchesQuery(item: DomainEntry, query: string): boolean {
	if (!query) {
		return true;
	}
	const needle = query.toLowerCase();
	return (
		item.name.toLowerCase().includes(needle) ||
		(item.cn ?? '').toLowerCase().includes(needle) ||
		(item.displayName ?? '').toLowerCase().includes(needle) ||
		(item.description ?? '').toLowerCase().includes(needle) ||
		item.dn.toLowerCase().includes(needle)
	);
}

export function DomainTab({ server, fill = false }: { server: SambaServer; fill?: boolean }) {
	const launchApp = useAppManager((state) => state.launchApp);
	const queryClient = useQueryClient();
	const snapshot = useQuery({
		queryKey: queryKeys.samba.directory(server.id),
		queryFn: () => sambaApi.directory(server.id),
	});
	const tree = useMemo<DomainTree | null>(() => {
		const value = snapshot.data?.tree;
		if (!value) {
			return null;
		}
		return {
			ous: value.ous,
			users: value.users.map((item) => ({ ...item, enabled: item.enabled !== false })),
			groups: value.groups.map((item) => ({ ...item, members: item.members ?? [] })),
		};
	}, [snapshot.data]);
	const [selected, setSelected] = useState('');
	const [note, setNote] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [query, setQuery] = useState('');
	const nodes = useMemo(() => (tree ? buildOuNodes(tree) : []), [tree]);

	useEffect(() => {
		if (!selected && nodes[0]?.dn) {
			setSelected(nodes[0].dn);
		}
	}, [nodes, selected]);

	const load = async () => {
		setBusy(true);
		setNote(null);
		try {
			await runCommand(server.id, 'directory.read', {});
			await queryClient.invalidateQueries({ queryKey: queryKeys.samba.directory(server.id) });
			setNote('Структура обновлена');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const open = (kind: Kind, name: string, create: boolean) => {
		const lists = tree ?? { ous: [], users: [], groups: [] };
		void launchApp('samba-servers', {
			instanceKey: create ? `new-${server.id}-${kind}-${Date.now()}` : `object-${server.id}-${kind}-${name}`,
			title: create ? 'Новая запись' : name,
			props: {
				serverId: server.id,
				kind,
				name,
				create,
				canManage: server.can_manage,
				parent: selected,
				ous: lists.ous,
				users: lists.users,
				groups: lists.groups,
			},
		});
	};

	const remove = (kind: Kind, name: string) => {
		confirmAction({
			title: 'Удаление',
			message: `Удалить «${name}»?`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => {
				void runCommand(server.id, `${kind}.delete`, { name }).then(() => load());
			},
		});
	};

	const selectedKey = selected.toLowerCase();
	const underSelected = (dn: string) => {
		if (!dn) {
			return false;
		}
		return parentDn(dn).toLowerCase() === selectedKey;
	};

	const filteredOus = useMemo(() => {
		if (!tree) {
			return [];
		}
		return tree.ous.filter((item) => matchesQuery(item, query));
	}, [tree, query]);

	const filteredUsers = useMemo(() => {
		if (!tree) {
			return [];
		}
		return tree.users.filter((item) => matchesQuery(item, query));
	}, [tree, query]);

	const filteredGroups = useMemo(() => {
		if (!tree) {
			return [];
		}
		return tree.groups.filter((item) => matchesQuery(item, query));
	}, [tree, query]);

	const childOus = filteredOus.filter((item) => underSelected(item.dn));
	const childUsers = filteredUsers.filter(
		(item) => underSelected(item.dn) || (!item.dn && selectedKey === (nodes[0]?.dn.toLowerCase() ?? '')),
	);
	const childGroups = filteredGroups.filter(
		(item) => underSelected(item.dn) || (!item.dn && selectedKey === (nodes[0]?.dn.toLowerCase() ?? '')),
	);

	return (
		<Stack gap="sm" p={fill ? 'md' : 0} h={fill ? '100%' : undefined} style={{ minHeight: 0, flex: fill ? 1 : undefined }}>
			<Group>
				<Button w="fit-content" loading={busy || snapshot.isFetching} onClick={() => void load()}>
					Обновить
				</Button>
				<Text size="sm" c="dimmed">
					{snapshot.data?.synced_at ? `Снимок: ${snapshot.data.synced_at}` : 'Снимка ещё нет'}
					{tree ? ` · OU ${tree.ous.length} · пользователи ${tree.users.length} · группы ${tree.groups.length}` : ''}
				</Text>
			</Group>
			{snapshot.isError ? <Text c="red" size="sm">{extractApiErrorMessage(snapshot.error)}</Text> : null}
			{note ? (
				<Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
					{note}
				</Text>
			) : null}
			{tree ? (
				<Tabs defaultValue="ous" keepMounted style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
					<Tabs.List>
						<Tabs.Tab value="ous">Подразделения ({tree.ous.length})</Tabs.Tab>
						<Tabs.Tab value="users">Пользователи ({tree.users.length})</Tabs.Tab>
						<Tabs.Tab value="groups">Группы ({tree.groups.length})</Tabs.Tab>
						<Tabs.Tab value="folder">В папке</Tabs.Tab>
					</Tabs.List>
					<TextInput
						mt="sm"
						placeholder="Поиск по имени, CN или DN"
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
					<Tabs.Panel value="ous" pt="sm" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
						<Group align="stretch" wrap="nowrap" gap="md" h="100%" style={{ minHeight: fill ? 0 : 360 }}>
							<Stack
								w={340}
								miw={280}
								gap={4}
								style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, flexShrink: 0 }}
							>
								<Text fw={600}>Дерево OU</Text>
								{nodes.length === 0 ? <Text size="sm" c="dimmed">Нет узлов</Text> : null}
								{nodes.map((node) => (
									<TreeNode key={node.dn} node={node} depth={0} selected={selected} onSelect={setSelected} />
								))}
							</Stack>
							<Stack flex={1} gap="xs" style={{ overflowY: 'auto', minHeight: 0 }}>
								{server.can_manage ? (
									<Button w="fit-content" size="xs" variant="light" onClick={() => open('ou', '', true)}>
										Новое подразделение
									</Button>
								) : null}
								<Rows
									rows={filteredOus}
									onOpen={(name) => open('ou', name, false)}
									onDelete={server.can_manage ? (name) => remove('ou', name) : undefined}
								/>
							</Stack>
						</Group>
					</Tabs.Panel>
					<Tabs.Panel value="users" pt="sm" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
						{server.can_manage ? (
							<Button mb="sm" w="fit-content" size="xs" variant="light" onClick={() => open('user', '', true)}>
								Новый пользователь
							</Button>
						) : null}
						<Rows
							rows={filteredUsers}
							onOpen={(name) => open('user', name, false)}
							onDelete={server.can_manage ? (name) => remove('user', name) : undefined}
						/>
					</Tabs.Panel>
					<Tabs.Panel value="groups" pt="sm" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
						{server.can_manage ? (
							<Button mb="sm" w="fit-content" size="xs" variant="light" onClick={() => open('group', '', true)}>
								Новая группа
							</Button>
						) : null}
						<Rows
							rows={filteredGroups}
							onOpen={(name) => open('group', name, false)}
							onDelete={server.can_manage ? (name) => remove('group', name) : undefined}
						/>
					</Tabs.Panel>
					<Tabs.Panel value="folder" pt="sm" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
						<Group align="stretch" wrap="nowrap" gap="md" h="100%" style={{ minHeight: fill ? 0 : 360 }}>
							<Stack
								w={340}
								miw={280}
								gap={4}
								style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, flexShrink: 0 }}
							>
								<Text fw={600}>Контейнер</Text>
								{nodes.map((node) => (
									<TreeNode key={node.dn} node={node} depth={0} selected={selected} onSelect={setSelected} />
								))}
							</Stack>
							<Stack flex={1} gap="xs" style={{ overflowY: 'auto', minHeight: 0 }}>
								<Text fw={600}>{labelOf(selected, tree.ous)}</Text>
								<Text size="xs" c="dimmed">
									DN: {selected || '—'}
								</Text>
								{server.can_manage ? (
									<Group>
										<Button size="xs" variant="light" onClick={() => open('user', '', true)}>
											Пользователь
										</Button>
										<Button size="xs" variant="light" onClick={() => open('group', '', true)}>
											Группа
										</Button>
										<Button size="xs" variant="light" onClick={() => open('ou', '', true)}>
											Подразделение
										</Button>
									</Group>
								) : null}
								<Text fw={600}>Подразделения ({childOus.length})</Text>
								<Rows
									rows={childOus}
									onOpen={(name) => open('ou', name, false)}
									onDelete={server.can_manage ? (name) => remove('ou', name) : undefined}
								/>
								<Text fw={600}>Пользователи ({childUsers.length})</Text>
								<Rows
									rows={childUsers}
									onOpen={(name) => open('user', name, false)}
									onDelete={server.can_manage ? (name) => remove('user', name) : undefined}
								/>
								<Text fw={600}>Группы ({childGroups.length})</Text>
								<Rows
									rows={childGroups}
									onOpen={(name) => open('group', name, false)}
									onDelete={server.can_manage ? (name) => remove('group', name) : undefined}
								/>
							</Stack>
						</Group>
					</Tabs.Panel>
				</Tabs>
			) : null}
		</Stack>
	);
}

function TreeNode({
	node,
	depth,
	selected,
	onSelect,
}: {
	node: Node;
	depth: number;
	selected: string;
	onSelect: (dn: string) => void;
}) {
	const active = selected.toLowerCase() === node.dn.toLowerCase();
	return (
		<>
			<UnstyledButton
				onClick={() => onSelect(node.dn)}
				title={node.dn}
				style={{
					display: 'block',
					width: '100%',
					padding: '6px 10px',
					paddingLeft: 10 + Math.min(depth, 8) * 16,
					borderRadius: 6,
					background: active ? 'var(--mantine-color-default-hover)' : undefined,
					textAlign: 'left',
				}}
			>
				<Text size="sm" fw={active ? 600 : 400} lineClamp={1}>
					{node.label}
				</Text>
			</UnstyledButton>
			{node.children.map((child) => (
				<TreeNode key={child.dn} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
			))}
		</>
	);
}

function Rows({
	rows,
	onOpen,
	onDelete,
}: {
	rows: DomainEntry[];
	onOpen: (name: string) => void;
	onDelete?: (name: string) => void;
}) {
	return (
		<Stack gap={6}>
			{rows.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет
				</Text>
			) : null}
			{rows.map((item) => (
				<Group key={item.dn || item.name} justify="space-between" wrap="nowrap" align="flex-start">
					<Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
						<Text size="sm" fw={500}>
							{(item.displayName ?? '').trim() || item.name}
							{'enabled' in item && item.enabled === false ? ' · отключён' : ''}
						</Text>
						{(item.displayName ?? '').trim() ? (
							<Text size="xs" c="dimmed">
								{item.name}
							</Text>
						) : null}
						{item.description ? <Text size="xs">{item.description}</Text> : null}
						<Text size="xs" c="dimmed">
							CN: {item.cn || '—'}
						</Text>
						<Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
							DN: {item.dn || '—'}
						</Text>
					</Stack>
					<Group gap={4} wrap="nowrap">
						<Button size="xs" variant="subtle" onClick={() => onOpen(item.name)}>
							Открыть
						</Button>
						{onDelete ? (
							<Button size="xs" variant="subtle" color="red" onClick={() => onDelete(item.name)}>
								Удалить
							</Button>
						) : null}
					</Group>
				</Group>
			))}
		</Stack>
	);
}
