import { Button, Checkbox, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { SambaServer } from '@/core/api/endpoints/sambaApi';
import { confirmAction } from '@/core/confirm';

import { runCommand } from './domainCommand';

type Acl = { kind: 'user' | 'group'; name: string; access: 'read' | 'write' | 'admin' };

type Share = {
	name: string;
	path: string;
	comment: string;
	guest: boolean;
	enabled: boolean;
	acl: Acl[];
};

const ACCESS = [
	{ value: 'read', label: 'Только чтение' },
	{ value: 'write', label: 'Чтение и запись' },
	{ value: 'admin', label: 'Администратор' },
];

function parseShares(result: string | null): Share[] {
	if (!result) {
		return [];
	}
	const value = JSON.parse(result) as Share[];
	return Array.isArray(value) ? value : [];
}

function parseNames(result: string | null): { users: string[]; groups: string[] } {
	if (!result) {
		return { users: [], groups: [] };
	}
	const value = JSON.parse(result) as { users?: Array<{ name: string }>; groups?: Array<{ name: string }> };
	return {
		users: (value.users ?? []).map((item) => item.name),
		groups: (value.groups ?? []).map((item) => item.name),
	};
}

export function SharesTab({ server }: { server: SambaServer }) {
	const [shares, setShares] = useState<Share[]>([]);
	const [users, setUsers] = useState<string[]>([]);
	const [groups, setGroups] = useState<string[]>([]);
	const [current, setCurrent] = useState<Share | null>(null);
	const [note, setNote] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const root = '/srv/samba';

	const load = async () => {
		setBusy(true);
		setNote(null);
		try {
			const listed = await runCommand(server.id, 'shares.read', {});
			setShares(parseShares(listed));
			try {
				const directory = await runCommand(server.id, 'directory.read', {});
				const names = parseNames(directory);
				setUsers(names.users);
				setGroups(names.groups);
			} catch {
				setUsers([]);
				setGroups([]);
			}
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const save = async () => {
		if (!current) {
			return;
		}
		setBusy(true);
		setNote(null);
		try {
			const result = await runCommand(server.id, 'shares.apply', {
				name: current.name.trim(),
				path: current.path.trim(),
				comment: current.comment,
				guest: current.guest,
				enabled: current.enabled,
				recursive: true,
				acl: current.acl.filter((row) => row.name),
			});
			setNote(result);
			const listed = await runCommand(server.id, 'shares.read', {});
			setShares(parseShares(listed));
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const remove = () => {
		if (!current?.name) {
			return;
		}
		confirmAction({
			title: 'Удаление шары',
			message: `Удалить «${current.name}»?`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => {
				void runCommand(server.id, 'share.remove', { name: current.name }).then(() => {
					setCurrent(null);
					return load();
				});
			},
		});
	};

	return (
		<Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
			<Button w="fit-content" loading={busy} onClick={() => void load()}>Показать шары</Button>
			{note ? <Text size="sm">{note}</Text> : null}
			<Group align="stretch" wrap="nowrap" gap="md" style={{ flex: 1, minHeight: 320, overflow: 'hidden' }}>
				<Stack w={220} gap={4} style={{ overflowY: 'auto', minHeight: 0 }}>
					<Text fw={600}>Шары</Text>
					{server.can_shares ? (
						<Button
							size="xs"
							variant="light"
							onClick={() => setCurrent({ name: '', path: root, comment: '', guest: false, enabled: true, acl: [] })}
						>
							Добавить
						</Button>
					) : null}
					{shares.map((share) => (
						<Button
							key={share.name}
							size="xs"
							variant={current?.name === share.name ? 'light' : 'subtle'}
							justify="flex-start"
							onClick={() => setCurrent({ ...share, acl: share.acl ?? [] })}
						>
							{share.name}
						</Button>
					))}
				</Stack>
				<Stack flex={1} gap="xs" style={{ overflowY: 'auto', minHeight: 0 }}>
					{current ? (
						<>
							<Checkbox label="Включена" checked={current.enabled} disabled={!server.can_shares} onChange={(event) => setCurrent({ ...current, enabled: event.currentTarget.checked })} />
							<TextInput label="Имя" value={current.name} disabled={!server.can_shares} onChange={(event) => setCurrent({ ...current, name: event.currentTarget.value })} />
							<TextInput label="Путь" description={`Каталог внутри ${root}`} value={current.path} disabled={!server.can_shares} onChange={(event) => setCurrent({ ...current, path: event.currentTarget.value })} />
							<TextInput label="Комментарий" value={current.comment} disabled={!server.can_shares} onChange={(event) => setCurrent({ ...current, comment: event.currentTarget.value })} />
							<Checkbox label="Гостевой доступ" description="Остальные права не действуют" checked={current.guest} disabled={!server.can_shares} onChange={(event) => setCurrent({ ...current, guest: event.currentTarget.checked })} />
							<Text fw={600}>Контроль доступа</Text>
							{current.acl.map((row, index) => (
								<Group key={`${row.kind}-${row.name}-${index}`} wrap="nowrap" align="flex-end">
									<Select
										label="Кто"
										data={[{ value: 'user', label: 'Пользователь' }, { value: 'group', label: 'Группа' }]}
										value={row.kind}
										disabled={!server.can_shares}
										onChange={(value) => {
											const acl = [...current.acl];
											acl[index] = { ...row, kind: value === 'group' ? 'group' : 'user', name: '' };
											setCurrent({ ...current, acl });
										}}
									/>
									<Select
										label={row.kind === 'group' ? 'Группа' : 'Пользователь'}
										data={(row.kind === 'group' ? groups : users).map((name) => ({ value: name, label: name }))}
										value={row.name || null}
										searchable
										disabled={!server.can_shares}
										onChange={(value) => {
											const acl = [...current.acl];
											acl[index] = { ...row, name: value ?? '' };
											setCurrent({ ...current, acl });
										}}
									/>
									<Select
										label="Права"
										data={ACCESS}
										value={row.access}
										disabled={!server.can_shares}
										onChange={(value) => {
											const acl = [...current.acl];
											acl[index] = { ...row, access: value === 'write' || value === 'admin' ? value : 'read' };
											setCurrent({ ...current, acl });
										}}
									/>
									{server.can_shares ? (
										<Button variant="subtle" color="red" onClick={() => setCurrent({ ...current, acl: current.acl.filter((_, item) => item !== index) })}>
											Убрать
										</Button>
									) : null}
								</Group>
							))}
							{server.can_shares ? (
								<Group>
									<Button variant="light" onClick={() => setCurrent({ ...current, acl: [...current.acl, { kind: 'group', name: '', access: 'read' }] })}>
										Добавить право
									</Button>
									<Button loading={busy} onClick={() => void save()}>Сохранить</Button>
									{current.name ? <Button variant="light" color="red" onClick={remove}>Удалить</Button> : null}
								</Group>
							) : null}
						</>
					) : (
						<Text c="dimmed">Выберите шару</Text>
					)}
				</Stack>
			</Group>
		</Stack>
	);
}
