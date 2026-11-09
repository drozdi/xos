import { ActionIcon, Box, Button, Group, Modal, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconDownload, IconFolderPlus, IconRefresh, IconTrash, IconUpload } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sshApi, SshHostKeyError } from '@/core/api/endpoints/sshApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';

function childPath(dir: string, name: string): string {
	if (name === '..') {
		const trim = dir.replace(/\/+$/, '');
		const pos = trim.lastIndexOf('/');
		return pos <= 0 ? '/' : trim.slice(0, pos);
	}
	if (dir === '/' || dir === '' || dir === '.') {
		return `/${name}`;
	}
	return `${dir.replace(/\/+$/, '')}/${name}`;
}

function sizeLabel(size: number): string {
	if (size < 1024) {
		return `${size} Б`;
	}
	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} КБ`;
	}
	return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

export function SftpSession({
	connectionId,
	acceptHostKey,
	active,
	onHostKey,
	onStatus,
}: {
	connectionId: number;
	acceptHostKey: boolean;
	active: boolean;
	onHostKey: (fingerprint: string) => void;
	onStatus: (status: string) => void;
}) {
	const queryClient = useQueryClient();
	const fileRef = useRef<HTMLInputElement>(null);
	const onHostKeyRef = useRef(onHostKey);
	const onStatusRef = useRef(onStatus);
	onHostKeyRef.current = onHostKey;
	onStatusRef.current = onStatus;
	const [path, setPath] = useState('.');
	const [error, setError] = useState<string | null>(null);
	const [folderOpen, setFolderOpen] = useState(false);
	const [folderName, setFolderName] = useState('');
	const [renameFrom, setRenameFrom] = useState<string | null>(null);
	const [renameTo, setRenameTo] = useState('');
	const [busy, setBusy] = useState(false);

	const listing = useQuery({
		queryKey: queryKeys.sftp.list(connectionId, path),
		retry: false,
		queryFn: async () => {
			try {
				return await sshApi.sftpList({
					connection_id: connectionId,
					path,
					accept_host_key: acceptHostKey,
				});
			} catch (reason) {
				if (reason instanceof SshHostKeyError) {
					onHostKeyRef.current(reason.fingerprint);
				}
				throw reason;
			}
		},
	});

	const currentPath = listing.data?.path ?? path;

	useEffect(() => {
		if (!active) {
			return;
		}
		if (listing.isFetching) {
			onStatusRef.current('Подключение…');
			return;
		}
		if (listing.isError) {
			onStatusRef.current(extractApiErrorMessage(listing.error, 'Не удалось открыть каталог'));
			return;
		}
		onStatusRef.current(currentPath);
	}, [active, listing.isFetching, listing.isError, listing.error, currentPath]);

	const reload = async (nextPath = currentPath) => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.sftp.list(connectionId, nextPath) });
	};

	const act = async (task: () => Promise<void>): Promise<boolean> => {
		setBusy(true);
		setError(null);
		try {
			await task();
			await reload();
			return true;
		} catch (reason) {
			if (reason instanceof SshHostKeyError) {
				onHostKeyRef.current(reason.fingerprint);
				return false;
			}
			setError(extractApiErrorMessage(reason, 'Не удалось выполнить действие'));
			return false;
		} finally {
			setBusy(false);
		}
	};

	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: active ? 'flex' : 'none',
				flexDirection: 'column',
				minHeight: 0,
			}}
		>
			<Group gap="xs" px="sm" py={6} wrap="nowrap" style={{ borderBottom: '1px solid var(--xos-shell-border)' }}>
				<Text size="sm" ff="monospace" truncate style={{ flex: 1 }}>
					{currentPath}
				</Text>
				<ActionIcon variant="subtle" aria-label="Обновить" onClick={() => void reload()}>
					<IconRefresh size={16} />
				</ActionIcon>
				<ActionIcon variant="subtle" aria-label="Новый каталог" onClick={() => setFolderOpen(true)}>
					<IconFolderPlus size={16} />
				</ActionIcon>
				<ActionIcon variant="subtle" aria-label="Загрузить файл" onClick={() => fileRef.current?.click()}>
					<IconUpload size={16} />
				</ActionIcon>
				<input
					ref={fileRef}
					type="file"
					hidden
					onChange={(event) => {
						const file = event.currentTarget.files?.[0];
						event.currentTarget.value = '';
						if (!file) {
							return;
						}
						void act(() =>
							sshApi.sftpUpload(
								{ connection_id: connectionId, path: currentPath, accept_host_key: acceptHostKey },
								file,
							),
						);
					}}
				/>
			</Group>
			<Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }} px="sm" py="xs">
				{error ? (
					<Text size="sm" c="red" mb="xs">
						{error}
					</Text>
				) : null}
				{listing.isError && !(listing.error instanceof SshHostKeyError) ? (
					<Text size="sm" c="red" mb="xs">
						{extractApiErrorMessage(listing.error, 'Не удалось открыть каталог')}
					</Text>
				) : null}
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Имя</Table.Th>
							<Table.Th>Размер</Table.Th>
							<Table.Th />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(listing.data?.entries ?? []).map((entry) => (
							<Table.Tr key={entry.name}>
								<Table.Td>
									{entry.dir ? (
										<Button
											variant="subtle"
											size="compact-sm"
											onClick={() => {
												setPath(childPath(currentPath, entry.name));
												setError(null);
											}}
										>
											{entry.name}
										</Button>
									) : (
										entry.name
									)}
								</Table.Td>
								<Table.Td>{entry.dir ? '' : sizeLabel(entry.size)}</Table.Td>
								<Table.Td>
									<Group gap={4} justify="flex-end" wrap="nowrap">
										{entry.name !== '..' ? (
											<Button
												size="compact-xs"
												variant="subtle"
												onClick={() => {
													setRenameFrom(entry.name);
													setRenameTo(entry.name);
												}}
											>
												Имя
											</Button>
										) : null}
										{entry.name !== '..' && !entry.dir ? (
											<ActionIcon
												variant="subtle"
												aria-label="Скачать"
												onClick={() => {
													void act(async () => {
														const blob = await sshApi.sftpDownload({
															connection_id: connectionId,
															path: childPath(currentPath, entry.name),
															accept_host_key: acceptHostKey,
														});
														const url = URL.createObjectURL(blob);
														const anchor = document.createElement('a');
														anchor.href = url;
														anchor.download = entry.name;
														anchor.click();
														URL.revokeObjectURL(url);
													});
												}}
											>
												<IconDownload size={16} />
											</ActionIcon>
										) : null}
										{entry.name !== '..' ? (
											<ActionIcon
												variant="subtle"
												color="red"
												aria-label="Удалить"
												onClick={() =>
													confirmAction({
														title: 'Удаление',
														message: `Удалить «${entry.name}»?`,
														confirmLabel: 'Удалить',
														confirmColor: 'red',
														onConfirm: () => {
															void act(() =>
																sshApi.sftpRemove({
																	connection_id: connectionId,
																	path: childPath(currentPath, entry.name),
																	accept_host_key: acceptHostKey,
																}),
															);
														},
													})
												}
											>
												<IconTrash size={16} />
											</ActionIcon>
										) : null}
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Box>
			<Modal opened={folderOpen} onClose={() => setFolderOpen(false)} title="Новый каталог" centered>
				<Stack gap="sm">
					<TextInput
						label="Имя"
						value={folderName}
						onChange={(event) => setFolderName(event.currentTarget.value)}
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setFolderOpen(false)}>
							Отмена
						</Button>
						<Button
							loading={busy}
							onClick={() => {
								const name = folderName.trim();
								if (!name) {
									return;
								}
								void act(() =>
									sshApi.sftpMkdir({
										connection_id: connectionId,
										path: currentPath,
										name,
										accept_host_key: acceptHostKey,
									}),
								).then((ok) => {
									if (!ok) {
										return;
									}
									setFolderName('');
									setFolderOpen(false);
								});
							}}
						>
							Создать
						</Button>
					</Group>
				</Stack>
			</Modal>
			<Modal
				opened={renameFrom !== null}
				onClose={() => setRenameFrom(null)}
				title="Переименовать"
				centered
			>
				<Stack gap="sm">
					<TextInput label="Имя" value={renameTo} onChange={(event) => setRenameTo(event.currentTarget.value)} />
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setRenameFrom(null)}>
							Отмена
						</Button>
						<Button
							loading={busy}
							onClick={() => {
								if (!renameFrom || !renameTo.trim()) {
									return;
								}
								void act(() =>
									sshApi.sftpRename({
										connection_id: connectionId,
										path: childPath(currentPath, renameFrom),
										name: renameTo.trim(),
										accept_host_key: acceptHostKey,
									}),
								).then((ok) => {
									if (ok) {
										setRenameFrom(null);
									}
								});
							}}
						>
							Сохранить
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Box>
	);
}
