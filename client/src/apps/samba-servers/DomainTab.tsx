import { Button, Group, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { SambaServer } from '@/core/api/endpoints/sambaApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { confirmAction } from '@/core/confirm';

import { runCommand } from './domainCommand';

export type DomainEntry = { name: string; cn?: string; dn: string };

export type DomainTree = {
	ous: DomainEntry[];
	users: Array<DomainEntry & { enabled: boolean }>;
	groups: Array<DomainEntry & { members: string[] }>;
	truncated?: boolean;
};

type Node = { dn: string; label: string; children: Node[] };

function parseTree(result: string | null): DomainTree | null {
	if (!result) {
		return null;
	}
	try {
		const value = JSON.parse(result) as DomainTree;
		if (!Array.isArray(value.ous) || !Array.isArray(value.users) || !Array.isArray(value.groups)) {
			return null;
		}
		return value;
	} catch {
		return null;
	}
}

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

function buildNodes(tree: DomainTree): Node[] {
	const dns = new Set<string>();
	for (const item of [...tree.ous, ...tree.users, ...tree.groups]) {
		if (item.dn) {
			dns.add(item.dn);
			const parent = parentDn(item.dn);
			if (parent) {
				dns.add(parent);
			}
		}
	}
	for (const ou of tree.ous) {
		dns.add(ou.dn);
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

export function DomainTab({ server }: { server: SambaServer }) {
	const launchApp = useAppManager((state) => state.launchApp);
	const [tree, setTree] = useState<DomainTree | null>(null);
	const [selected, setSelected] = useState('');
	const [note, setNote] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const nodes = useMemo(() => (tree ? buildNodes(tree) : []), [tree]);

	const load = async () => {
		setBusy(true);
		setNote(null);
		try {
			const result = await runCommand(server.id, 'directory.read', {});
			const next = parseTree(result);
			setTree(next);
			if (!next) {
				setNote(result);
				return;
			}
			const built = buildNodes(next);
			setSelected((current) => current || built[0]?.dn || '');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const open = (kind: 'user' | 'group' | 'ou', name: string, create: boolean) => {
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

	const remove = (kind: 'user' | 'group' | 'ou', name: string) => {
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

	const here = (dn: string) => parentDn(dn).toLowerCase() === selected.toLowerCase();
	const childOus = tree?.ous.filter((item) => here(item.dn)) ?? [];
	const childUsers = tree?.users.filter((item) => here(item.dn)) ?? [];
	const childGroups = tree?.groups.filter((item) => here(item.dn)) ?? [];

	return (
		<Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
			<Button w="fit-content" loading={busy} onClick={() => void load()}>Показать структуру</Button>
			{note ? <Text size="sm">{note}</Text> : null}
			{tree ? (
				<Group align="stretch" wrap="nowrap" gap="md" style={{ flex: 1, minHeight: 320, overflow: 'hidden' }}>
					<Stack w={240} gap={2} style={{ overflowY: 'auto', minHeight: 0 }}>
						<Text fw={600}>Дерево</Text>
						{tree.truncated ? <Text size="xs" c="dimmed">Показана только часть записей</Text> : null}
						{nodes.map((node) => (
							<TreeNode key={node.dn} node={node} depth={0} selected={selected} onSelect={setSelected} />
						))}
					</Stack>
					<Stack flex={1} gap="xs" style={{ overflowY: 'auto', minHeight: 0 }}>
						<Text fw={600}>{labelOf(selected, tree.ous)}</Text>
						<Text size="xs" c="dimmed">DN: {selected || '—'}</Text>
						{server.can_manage ? (
							<Group>
								<Button size="xs" variant="light" onClick={() => open('user', '', true)}>Пользователь</Button>
								<Button size="xs" variant="light" onClick={() => open('group', '', true)}>Группа</Button>
								<Button size="xs" variant="light" onClick={() => open('ou', '', true)}>Подразделение</Button>
							</Group>
						) : null}
						<Rows title="Подразделения" rows={childOus} onOpen={(name) => open('ou', name, false)} onDelete={server.can_manage ? (name) => remove('ou', name) : undefined} />
						<Rows title="Пользователи" rows={childUsers} onOpen={(name) => open('user', name, false)} onDelete={server.can_manage ? (name) => remove('user', name) : undefined} />
						<Rows title="Группы" rows={childGroups} onOpen={(name) => open('group', name, false)} onDelete={server.can_manage ? (name) => remove('group', name) : undefined} />
					</Stack>
				</Group>
			) : null}
		</Stack>
	);
}

function TreeNode({ node, depth, selected, onSelect }: { node: Node; depth: number; selected: string; onSelect: (dn: string) => void }) {
	return (
		<>
			<Button
				size="xs"
				variant={selected.toLowerCase() === node.dn.toLowerCase() ? 'light' : 'subtle'}
				justify="flex-start"
				onClick={() => onSelect(node.dn)}
				style={{ paddingLeft: 8 + depth * 14 }}
			>
				{node.label}
			</Button>
			{node.children.map((child) => (
				<TreeNode key={child.dn} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
			))}
		</>
	);
}

function Rows({
	title,
	rows,
	onOpen,
	onDelete,
}: {
	title: string;
	rows: DomainEntry[];
	onOpen: (name: string) => void;
	onDelete?: (name: string) => void;
}) {
	return (
		<Stack gap={4}>
			<Text fw={600}>{title}</Text>
			{rows.length === 0 ? <Text size="sm" c="dimmed">Нет</Text> : null}
			{rows.map((item) => (
				<Group key={item.dn || item.name} justify="space-between" wrap="nowrap">
					<Stack gap={0} style={{ minWidth: 0 }}>
						<Text size="sm">{item.name}{'enabled' in item && item.enabled === false ? ' · отключён' : ''}</Text>
						<Text size="xs" c="dimmed">CN: {item.cn || '—'}</Text>
						<Text size="xs" c="dimmed" truncate>DN: {item.dn || '—'}</Text>
					</Stack>
					<Group gap={4} wrap="nowrap">
						<Button size="xs" variant="subtle" onClick={() => onOpen(item.name)}>Открыть</Button>
						{onDelete ? <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(item.name)}>Удалить</Button> : null}
					</Group>
				</Group>
			))}
		</Stack>
	);
}
