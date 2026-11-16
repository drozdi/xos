import { Badge, Button, Checkbox, Group, Stack, Tabs, Text, Textarea, TextInput } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sambaApi, type SambaRight, type SambaServer, type SambaServerWrite } from '@/core/api/endpoints/sambaApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { useAuthStore } from '@/core/auth/authStore';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { UserSelect } from '@/features/main/UserSelect';
import { useAppContext } from '@/core/context/AppContext';
import { DomainObject } from '@/apps/samba-servers/DomainObject';
import { DomainTab } from '@/apps/samba-servers/DomainTab';
import { SharesTab } from '@/apps/samba-servers/SharesTab';

const RIGHTS: Array<{ id: SambaRight; label: string }> = [
	{ id: 'view', label: 'Просмотр' },
	{ id: 'shares', label: 'Шары' },
	{ id: 'directory', label: 'Каталог' },
	{ id: 'provision', label: 'Службы' },
	{ id: 'manage', label: 'Управление' },
];

function roleLabel(server: SambaServer): string {
	return server.file ? 'Контроллер домена с шарами' : 'Контроллер домена';
}

function ServerBrowser() {
	useWindowTitle('Серверы Samba');
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [creating, setCreating] = useState(false);
	const servers = useQuery({ queryKey: queryKeys.samba.servers, queryFn: () => sambaApi.list() });
	const selected = (servers.data ?? []).find((server) => server.id === selectedId) ?? servers.data?.[0] ?? null;

	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.samba.servers });
	};

	return (
		<Group align="stretch" h="100%" gap="md" wrap="nowrap" p="md">
			<Stack w={280} gap="sm" style={{ overflow: 'auto' }}>
				<Group justify="space-between">
					<Text fw={600}>Серверы</Text>
					<Button size="xs" variant="light" onClick={() => setCreating(true)}>
						Новый
					</Button>
				</Group>
				{servers.isError ? <Text c="red" size="sm">{extractApiErrorMessage(servers.error)}</Text> : null}
				{(servers.data ?? []).length === 0 && !servers.isLoading ? (
					<Text size="sm" c="dimmed">Нет серверов</Text>
				) : null}
				{(servers.data ?? []).map((server) => (
					<Button
						key={server.id}
						variant={selected?.id === server.id ? 'light' : 'subtle'}
						justify="flex-start"
						onClick={() => setSelectedId(server.id)}
					>
						<Stack gap={0} align="flex-start">
							<Text size="sm" fw={600}>{server.name}</Text>
							<Text size="xs" c="dimmed">{roleLabel(server)}</Text>
						</Stack>
					</Button>
				))}
			</Stack>
			<Stack flex={1} style={{ overflow: 'auto' }}>
				{creating ? (
					<ServerForm
						onCancel={() => setCreating(false)}
						onSaved={async () => {
							setCreating(false);
							await refresh();
						}}
					/>
				) : selected ? (
					<ServerCard
						key={selected.id}
						server={selected}
						onChanged={refresh}
						onDeleted={async () => {
							setSelectedId(null);
							await refresh();
						}}
					/>
				) : (
					<Text c="dimmed">Выберите сервер</Text>
				)}
			</Stack>
		</Group>
	);
}

function ServerForm({
	server,
	onCancel,
	onSaved,
}: {
	server?: SambaServer;
	onCancel: () => void;
	onSaved: () => Promise<void>;
}) {
	const [name, setName] = useState(server?.name ?? '');
	const [description, setDescription] = useState(server?.description ?? '');
	const [file, setFile] = useState(server?.file ?? false);
	const [timezone, setTimezone] = useState(server?.expected_timezone ?? 'Europe/Moscow');
	const [error, setError] = useState<string | null>(null);
	const save = useMutation({
		mutationFn: (payload: SambaServerWrite) => (server ? sambaApi.update(server.id, payload) : sambaApi.create(payload)),
		onSuccess: onSaved,
		onError: (reason: unknown) => setError(extractApiErrorMessage(reason)),
	});

	return (
		<Stack>
			<Text fw={600}>{server ? 'Сервер' : 'Новый сервер'}</Text>
			<TextInput label="Название" value={name} onChange={(event) => setName(event.currentTarget.value)} />
			<Textarea label="Описание" value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
			<Checkbox label="Раздаёт шары" checked={file} onChange={(event) => setFile(event.currentTarget.checked)} />
			<TextInput label="Часовой пояс" value={timezone} onChange={(event) => setTimezone(event.currentTarget.value)} />
			<Badge variant="light">Новый</Badge>
			{error ? <Text c="red" size="sm">{error}</Text> : null}
			<Group>
				<Button variant="default" onClick={onCancel}>Отмена</Button>
				<Button
					loading={save.isPending}
					onClick={() =>
						save.mutate({
							name: name.trim(),
							description,
							role: 'ad_dc',
							file,
							expected_timezone: timezone.trim(),
						})
					}
				>
					Сохранить
				</Button>
			</Group>
		</Stack>
	);
}

function installCommand(serverId: number, login: string): string {
	const user = login.replaceAll("'", `'\\''`);
	const origin = window.location.origin;
	return `curl -fsS -u '${user}' -X POST ${origin}/api/samba/agent/bundle -H 'Content-Type: application/json' -d '{"server_id":${serverId}}' -o xos-agent.zip && unzip -o xos-agent.zip && sudo sh install.sh`;
}

function ServerCard({
	server,
	onChanged,
	onDeleted,
}: {
	server: SambaServer;
	onChanged: () => Promise<void>;
	onDeleted: () => Promise<void>;
}) {
	const [editing, setEditing] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const login = useAuthStore((state) => state.user?.login) || 'ЛОГИН';

	if (editing && server.owner) {
		return (
			<ServerForm
				server={server}
				onCancel={() => setEditing(false)}
				onSaved={async () => {
					setEditing(false);
					await onChanged();
				}}
			/>
		);
	}

	return (
		<Stack>
			<Group justify="space-between">
				<Text fw={600}>{server.name}</Text>
				<Badge>{server.status === 'new' ? 'Новый' : server.status}</Badge>
			</Group>
			<Text size="sm">{roleLabel(server)}</Text>
			<Text size="sm" c="dimmed">{server.description || 'Без описания'}</Text>
			<Text size="sm">Пояс: {server.expected_timezone}</Text>
			<Text size="sm">Владелец: {server.owner_label}</Text>
			{server.owner ? (
				<Group>
					<Button variant="light" w="fit-content" onClick={() => setEditing(true)}>
						Изменить
					</Button>
					<Button
						variant="light"
						color="red"
						w="fit-content"
						onClick={() =>
							confirmAction({
								title: 'Удаление',
								message: `Удалить «${server.name}»? Связь с агентом тоже снимется.`,
								confirmLabel: 'Удалить',
								confirmColor: 'red',
								onConfirm: () => {
									void sambaApi.remove(server.id).then(onDeleted).catch((reason: unknown) => {
										setError(extractApiErrorMessage(reason));
									});
								},
							})
						}
					>
						Удалить
					</Button>
				</Group>
			) : null}
			{server.owner || server.can_directory || server.can_manage || server.can_shares ? (
				<Tabs defaultValue={server.owner ? 'server' : server.can_directory || server.can_manage ? 'domain' : 'shares'}>
					<Tabs.List>
						{server.owner ? <Tabs.Tab value="server">Сервер</Tabs.Tab> : null}
						{server.owner ? <Tabs.Tab value="install">Установка</Tabs.Tab> : null}
						{server.can_directory || server.can_manage ? <Tabs.Tab value="domain">Домен</Tabs.Tab> : null}
						{server.owner || server.can_shares ? <Tabs.Tab value="shares">Шары</Tabs.Tab> : null}
					</Tabs.List>
					{server.owner ? (
						<Tabs.Panel value="server" pt="sm">
							<OwnerTools server={server} onChanged={onChanged} onError={setError} />
						</Tabs.Panel>
					) : null}
					{server.owner ? (
						<Tabs.Panel value="install" pt="sm">
							<InstallCommand serverId={server.id} login={login} copied={copied} onCopied={() => setCopied(true)} />
						</Tabs.Panel>
					) : null}
					{server.can_directory || server.can_manage ? (
						<Tabs.Panel value="domain" pt="sm">
							<DomainTab server={server} />
						</Tabs.Panel>
					) : null}
					{server.owner || server.can_shares ? (
						<Tabs.Panel value="shares" pt="sm">
							<SharesTab server={server} />
						</Tabs.Panel>
					) : null}
				</Tabs>
			) : null}
			{error ? <Text c="red" size="sm">{error}</Text> : null}
		</Stack>
	);
}

function OwnerTools({
	server,
	onChanged,
	onError,
}: {
	server: SambaServer;
	onChanged: () => Promise<void>;
	onError: (message: string) => void;
}) {
	const [userId, setUserId] = useState<number | null>(null);
	const [rights, setRights] = useState<SambaRight[]>(['view']);
	const [ownerId, setOwnerId] = useState<number | null>(null);

	return (
		<Stack gap="xs">
			<Text fw={600}>Доступ</Text>
			{server.access.map((grant) => (
				<Group key={grant.user_id} justify="space-between">
					<Text size="sm">{grant.label}: {grant.rights.join(', ')}</Text>
					<Button
						size="xs"
						variant="subtle"
						color="red"
						onClick={() =>
							confirmAction({
								title: 'Отзыв',
								message: `Отозвать доступ у ${grant.label}?`,
								confirmLabel: 'Отозвать',
								confirmColor: 'red',
								onConfirm: () => {
									void sambaApi.revoke(server.id, grant.user_id).then(onChanged).catch((reason: unknown) => {
										onError(extractApiErrorMessage(reason));
									});
								},
							})
						}
					>
						Отозвать
					</Button>
				</Group>
			))}
			<UserSelect label="Пользователь" value={userId} onChange={setUserId} />
			<Group>
				{RIGHTS.map((right) => (
					<Checkbox
						key={right.id}
						label={right.label}
						checked={rights.includes(right.id)}
						onChange={(event) =>
							setRights((current) =>
								event.currentTarget.checked
									? [...current, right.id]
									: current.filter((item) => item !== right.id),
							)
						}
					/>
				))}
			</Group>
			<Button
				w="fit-content"
				onClick={() => {
					if (!userId || rights.length === 0) {
						return;
					}
					void sambaApi.grant(server.id, userId, rights).then(onChanged).catch((reason: unknown) => {
						onError(extractApiErrorMessage(reason));
					});
				}}
			>
				Выдать
			</Button>
			<Text fw={600}>Передача</Text>
			<UserSelect label="Новый владелец" value={ownerId} onChange={setOwnerId} />
			<Button
				variant="light"
				w="fit-content"
				onClick={() => {
					if (!ownerId) {
						return;
					}
					void sambaApi.transfer(server.id, ownerId).then(onChanged).catch((reason: unknown) => {
						onError(extractApiErrorMessage(reason));
					});
				}}
			>
				Передать
			</Button>
		</Stack>
	);
}

function InstallCommand({
	serverId,
	login,
	copied,
	onCopied,
}: {
	serverId: number;
	login: string;
	copied: boolean;
	onCopied: () => void;
}) {
	const command = installCommand(serverId, login);

	return (
		<Stack gap="xs">
			<Text size="sm">Выполните на сервере Samba. Пароль спросит curl.</Text>
			<Text size="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
				{command}
			</Text>
			<Button
				w="fit-content"
				variant="light"
				onClick={() => {
					void navigator.clipboard.writeText(command).then(onCopied);
				}}
			>
				{copied ? 'Скопировано' : 'Копировать'}
			</Button>
		</Stack>
	);
}

export default function SambaServersApp() {
	const { props } = useAppContext();
	if (props?.kind === 'user' || props?.kind === 'group' || props?.kind === 'ou') {
		return <DomainObject />;
	}
	return <ServerBrowser />;
}
