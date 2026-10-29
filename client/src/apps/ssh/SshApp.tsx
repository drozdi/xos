import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Modal,
	NumberInput,
	PasswordInput,
	SegmentedControl,
	Select,
	Stack,
	Tabs,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlayerPlay, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import {
	sshApi,
	type SshAuth,
	type SshConnection,
	type SshConnectionWrite,
} from '@/core/api/endpoints/sshApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { SshKeysPanel } from './SshKeysPanel';
import { SshTerminal } from './SshTerminal';

type EditorState = {
	id: number | null;
	name: string;
	host: string;
	port: number | string;
	username: string;
	auth: SshAuth;
	secret: string;
	keyId: number | null;
	inline: boolean;
	hasSecret: boolean;
};

type LiveSession = {
	tabId: string;
	connectionId: number;
	title: string;
	acceptHostKey: boolean;
	sourceIp: string | null;
};

const emptyEditor = (): EditorState => ({
	id: null,
	name: '',
	host: '',
	port: 22,
	username: '',
	auth: 'password',
	secret: '',
	keyId: null,
	inline: false,
	hasSecret: false,
});

function editorFrom(connection: SshConnection): EditorState {
	return {
		id: connection.id,
		name: connection.name,
		host: connection.host,
		port: connection.port,
		username: connection.username,
		auth: connection.auth,
		secret: '',
		keyId: connection.key_id,
		inline: connection.inline_key,
		hasSecret: connection.has_secret,
	};
}

function toPayload(editor: EditorState): SshConnectionWrite {
	const port = typeof editor.port === 'number' ? editor.port : Number(editor.port);
	const payload: SshConnectionWrite = {
		name: editor.name.trim(),
		host: editor.host.trim(),
		port,
		username: editor.username.trim(),
		auth: editor.auth,
	};
	if (editor.auth === 'password') {
		payload.passphrase = null;
		payload.key_id = null;
		if (editor.secret.trim()) {
			payload.secret = editor.secret;
		}
	} else {
		payload.key_id = editor.keyId;
	}
	return payload;
}

export default function SshApp() {
	useWindowTitle('SSH');
	const queryClient = useQueryClient();
	const [editor, setEditor] = useState<EditorState | null>(null);
	const [sessions, setSessions] = useState<LiveSession[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);

	const connectionsQuery = useQuery({
		queryKey: queryKeys.ssh.connections,
		queryFn: () => sshApi.list(),
	});
	const keysQuery = useQuery({
		queryKey: queryKeys.ssh.keys,
		queryFn: () => sshApi.keys(),
	});

	const saveMutation = useMutation({
		mutationFn: async (state: EditorState) => {
			const payload = toPayload(state);
			if (state.id == null) {
				return sshApi.create(payload);
			}
			return sshApi.update(state.id, payload);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.ssh.connections });
			setEditor(null);
		},
		onError: (error: unknown) => {
			notifyApiError(error, 'Не удалось сохранить подключение');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => sshApi.remove(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.ssh.connections });
		},
		onError: (error: unknown) => {
			notifyApiError(error, 'Не удалось удалить подключение');
		},
	});

	const openSession = (connection: SshConnection) => {
		const tabId = crypto.randomUUID();
		setSessions((current) => [
			...current,
			{
				tabId,
				connectionId: connection.id,
				title: connection.name,
				acceptHostKey: false,
				sourceIp: null,
			},
		]);
		setActiveTabId(tabId);
	};

	const closeSession = (tabId: string) => {
		setSessions((current) => {
			const next = current.filter((session) => session.tabId !== tabId);
			setActiveTabId((active) => {
				if (active !== tabId) {
					return active;
				}
				return next[next.length - 1]?.tabId ?? null;
			});
			return next;
		});
	};

	const activeSession = sessions.find((session) => session.tabId === activeTabId) ?? null;
	const connections = connectionsQuery.data ?? [];
	const keys = keysQuery.data ?? [];
	const keyOptions = [
		...(editor?.inline ? [{ value: 'inline', label: 'Ключ в этом подключении' }] : []),
		...keys.map((key) => ({ value: String(key.id), label: `${key.name} · ${key.type}` })),
	];

	const save = () => {
		if (!editor) {
			return;
		}
		if (editor.auth === 'password' && editor.id == null && !editor.secret.trim()) {
			notifications.show({ color: 'red', message: 'Укажите пароль' });
			return;
		}
		if (editor.auth === 'key' && editor.keyId == null && !editor.inline) {
			notifications.show({ color: 'red', message: 'Выберите ключ' });
			return;
		}
		saveMutation.mutate(editor);
	};

	return (
		<Box style={{ position: 'absolute', inset: 0, display: 'flex', minHeight: 0 }}>
			<Tabs
				defaultValue="connections"
				p="sm"
				w={320}
				h="100%"
				style={{
					borderRight: '1px solid var(--xos-shell-border)',
					display: 'flex',
					flexDirection: 'column',
					minHeight: 0,
					flexShrink: 0,
				}}
				styles={{ panel: { overflow: 'auto', flex: 1, paddingTop: 8 } }}
			>
				<Tabs.List grow>
					<Tabs.Tab value="connections">Подключения</Tabs.Tab>
					<Tabs.Tab value="keys">Ключи</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="connections">
			<Stack gap="xs">
				<Group justify="space-between">
					<Text fw={600}>Подключения</Text>
					<ActionIcon variant="light" aria-label="Новое подключение" onClick={() => setEditor(emptyEditor())}>
						<IconPlus size={16} />
					</ActionIcon>
				</Group>
				<Text size="xs" c="dimmed">
					Сессия открывается с сервера XOS. Пароль и ключ хранятся в зашифрованном виде.
				</Text>
				{connectionsQuery.isError ? (
					<Text size="sm" c="red">
						{extractApiErrorMessage(connectionsQuery.error, 'Не удалось загрузить список')}
					</Text>
				) : null}
				{connections.length === 0 && !connectionsQuery.isLoading ? (
					<Text size="sm" c="dimmed">
						Нет сохранённых подключений
					</Text>
				) : null}
				{connections.map((connection) => (
					<Group key={connection.id} gap={6} wrap="nowrap" align="flex-start">
						<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
							<Text size="sm" fw={600} truncate>
								{connection.name}
							</Text>
							<Text size="xs" c="dimmed" truncate>
								{connection.username}@{connection.host}:{connection.port}
							</Text>
							<Text size="xs" c="dimmed">
								{connection.auth === 'key'
									? connection.key_name
										? `Ключ · ${connection.key_name}`
										: 'Ключ'
									: 'Пароль'}
							</Text>
						</Stack>
						<ActionIcon
							variant="subtle"
							aria-label="Подключиться"
							onClick={() => openSession(connection)}
						>
							<IconPlayerPlay size={16} />
						</ActionIcon>
						<ActionIcon variant="subtle" aria-label="Изменить" onClick={() => setEditor(editorFrom(connection))}>
							<IconPencil size={16} />
						</ActionIcon>
						<ActionIcon
							variant="subtle"
							color="red"
							aria-label="Удалить"
							onClick={() =>
								confirmAction({
									title: 'Удаление',
									message: `Удалить «${connection.name}»?`,
									confirmLabel: 'Удалить',
									confirmColor: 'red',
									onConfirm: () => {
										setSessions((current) => {
											const next = current.filter(
												(session) => session.connectionId !== connection.id,
											);
											setActiveTabId((active) =>
												next.some((session) => session.tabId === active)
													? active
													: (next.at(-1)?.tabId ?? null),
											);
											return next;
										});
										deleteMutation.mutate(connection.id);
									},
								})
							}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				))}
			</Stack>
				</Tabs.Panel>
				<Tabs.Panel value="keys">
					<SshKeysPanel />
				</Tabs.Panel>
			</Tabs>
			<Box style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
				{sessions.length > 0 ? (
					<Group
						gap={4}
						px="xs"
						py={4}
						wrap="nowrap"
						style={{ borderBottom: '1px solid var(--xos-shell-border)', overflowX: 'auto' }}
					>
						{sessions.map((session) => {
							const selected = session.tabId === activeTabId;
							return (
								<Group
									key={session.tabId}
									gap={4}
									wrap="nowrap"
									px={8}
									py={4}
									style={{
										borderRadius: 6,
										cursor: 'pointer',
										background: selected ? 'var(--mantine-color-default-hover)' : undefined,
									}}
									onClick={() => setActiveTabId(session.tabId)}
								>
									<Text size="xs" fw={selected ? 600 : 400} truncate maw={160}>
										{session.title}
									</Text>
									<ActionIcon
										size="xs"
										variant="subtle"
										aria-label="Закрыть сессию"
										onClick={(event) => {
											event.stopPropagation();
											closeSession(session.tabId);
										}}
									>
										<IconX size={12} />
									</ActionIcon>
								</Group>
							);
						})}
					</Group>
				) : null}
				<Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
					{sessions.length === 0 ? (
						<Center h="100%">
							<Text size="sm" c="dimmed">
								Выберите подключение
							</Text>
						</Center>
					) : (
						sessions.map((session) => (
							<SshTerminal
								key={`${session.tabId}:${session.acceptHostKey ? 'trust' : 'check'}`}
								connectionId={session.connectionId}
								acceptHostKey={session.acceptHostKey}
								active={session.tabId === activeTabId}
								onSourceIp={(sourceIp) =>
									setSessions((current) =>
										current.map((item) =>
											item.tabId === session.tabId ? { ...item, sourceIp } : item,
										),
									)
								}
								onHostKey={(fingerprint) => {
									confirmAction({
										title: 'Ключ сервера',
										message: `Отпечаток ${fingerprint} не совпадает с сохранённым. Подключаться только если вы ожидали смену ключа.`,
										confirmLabel: 'Доверять',
										confirmColor: 'red',
										onConfirm: () =>
											setSessions((current) =>
												current.map((item) =>
													item.tabId === session.tabId
														? { ...item, acceptHostKey: true, sourceIp: null }
														: item,
												),
											),
									});
								}}
							/>
						))
					)}
				</Box>
				<Text
					size="xs"
					px="sm"
					py={6}
					c="dimmed"
					style={{ borderTop: '1px solid var(--xos-shell-border)' }}
				>
					{activeSession
						? activeSession.sourceIp
							? `Подключение с ${activeSession.sourceIp}`
							: 'Подключение…'
						: 'Нет активного подключения'}
				</Text>
			</Box>
			<Modal
				opened={editor !== null}
				onClose={() => setEditor(null)}
				title={editor?.id == null ? 'Новое подключение' : 'Подключение'}
				centered
			>
				{editor ? (
					<Stack gap="sm">
						<TextInput
							label="Название"
							value={editor.name}
							onChange={(event) => setEditor({ ...editor, name: event.currentTarget.value })}
						/>
						<Group grow align="flex-start">
							<TextInput
								label="Хост"
								value={editor.host}
								onChange={(event) => setEditor({ ...editor, host: event.currentTarget.value })}
							/>
							<NumberInput
								label="Порт"
								min={1}
								max={65535}
								allowDecimal={false}
								value={editor.port}
								onChange={(value) => setEditor({ ...editor, port: value })}
							/>
						</Group>
						<TextInput
							label="Пользователь"
							value={editor.username}
							onChange={(event) => setEditor({ ...editor, username: event.currentTarget.value })}
						/>
						<SegmentedControl
							value={editor.auth}
							onChange={(value) =>
								setEditor({
									...editor,
									auth: value === 'key' ? 'key' : 'password',
									secret: '',
								})
							}
							data={[
								{ value: 'password', label: 'Пароль' },
								{ value: 'key', label: 'Ключ' },
							]}
						/>
						{editor.auth === 'password' ? (
							<PasswordInput
								label="Пароль"
								placeholder={editor.hasSecret ? 'Оставьте пустым, чтобы не менять' : undefined}
								value={editor.secret}
								onChange={(event) => setEditor({ ...editor, secret: event.currentTarget.value })}
							/>
						) : (
							<Select
								label="Ключ"
								placeholder={keys.length === 0 ? 'Сначала создайте ключ' : 'Выберите ключ'}
								data={keyOptions}
								value={editor.keyId == null ? (editor.inline ? 'inline' : null) : String(editor.keyId)}
								onChange={(value) =>
									setEditor({
										...editor,
										keyId: value && value !== 'inline' ? Number(value) : null,
									})
								}
								allowDeselect={false}
							/>
						)}
						<Group justify="flex-end">
							<Button variant="default" onClick={() => setEditor(null)}>
								Отмена
							</Button>
							<Button loading={saveMutation.isPending} onClick={save}>
								Сохранить
							</Button>
						</Group>
					</Stack>
				) : null}
			</Modal>
		</Box>
	);
}
