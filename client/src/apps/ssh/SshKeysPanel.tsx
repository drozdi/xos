import { ActionIcon, Button, Group, Modal, PasswordInput, SegmentedControl, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { sshApi, type SshKey } from '@/core/api/endpoints/sshApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';

type KeyDraft = {
	mode: 'generate' | 'import';
	name: string;
	type: 'ed25519' | 'rsa';
	secret: string;
	passphrase: string;
};

const emptyDraft = (): KeyDraft => ({
	mode: 'generate',
	name: '',
	type: 'ed25519',
	secret: '',
	passphrase: '',
});

export function SshKeysPanel() {
	const queryClient = useQueryClient();
	const [draft, setDraft] = useState<KeyDraft | null>(null);
	const [shown, setShown] = useState<SshKey | null>(null);
	const keysQuery = useQuery({
		queryKey: queryKeys.ssh.keys,
		queryFn: () => sshApi.keys(),
	});

	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.ssh.keys });
	};

	const saveMutation = useMutation({
		mutationFn: async (state: KeyDraft) => {
			if (state.mode === 'generate') {
				return sshApi.generateKey({
					name: state.name.trim(),
					type: state.type,
					passphrase: state.passphrase || undefined,
				});
			}
			return sshApi.importKey({
				name: state.name.trim(),
				secret: state.secret,
				passphrase: state.passphrase || undefined,
			});
		},
		onSuccess: async (key) => {
			await refresh();
			setDraft(null);
			setShown(key);
		},
		onError: (error: unknown) => {
			notifyApiError(error, 'Не удалось сохранить ключ');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => sshApi.removeKey(id),
		onSuccess: refresh,
		onError: (error: unknown) => {
			notifyApiError(error, 'Не удалось удалить ключ');
		},
	});

	const keys = keysQuery.data ?? [];

	const copyPublic = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			notifications.show({ color: 'green', message: 'Публичный ключ скопирован' });
		} catch {
			notifications.show({ color: 'red', message: 'Не удалось скопировать' });
		}
	};

	return (
		<Stack gap="xs">
			<Group justify="space-between">
				<Text fw={600}>Ключи</Text>
				<ActionIcon variant="light" aria-label="Новый ключ" onClick={() => setDraft(emptyDraft())}>
					<IconPlus size={16} />
				</ActionIcon>
			</Group>
			<Text size="xs" c="dimmed">
				Публичную часть скопируйте в authorized_keys на сервере. Приватный ключ остаётся здесь.
			</Text>
			{keysQuery.isError ? (
				<Text size="sm" c="red">
					{extractApiErrorMessage(keysQuery.error, 'Не удалось загрузить ключи')}
				</Text>
			) : null}
			{keys.length === 0 && !keysQuery.isLoading ? (
				<Text size="sm" c="dimmed">
					Нет ключей
				</Text>
			) : null}
			{keys.map((key) => (
				<Group key={key.id} gap={6} wrap="nowrap" align="flex-start">
					<Stack
						gap={0}
						style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
						onClick={() => setShown(key)}
					>
						<Text size="sm" fw={600} truncate>
							{key.name}
						</Text>
						<Text size="xs" c="dimmed" truncate>
							{key.type} · {key.fingerprint}
						</Text>
					</Stack>
					<ActionIcon variant="subtle" aria-label="Копировать публичный ключ" onClick={() => void copyPublic(key.public_key)}>
						<IconCopy size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="red"
						aria-label="Удалить ключ"
						onClick={() =>
							confirmAction({
								title: 'Удаление ключа',
								message: `Удалить «${key.name}»?`,
								confirmLabel: 'Удалить',
								confirmColor: 'red',
								onConfirm: () => deleteMutation.mutate(key.id),
							})
						}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			))}
			<Modal opened={draft !== null} onClose={() => setDraft(null)} title="Ключ" centered>
				{draft ? (
					<Stack gap="sm">
						<SegmentedControl
							value={draft.mode}
							onChange={(value) =>
								setDraft({ ...draft, mode: value === 'import' ? 'import' : 'generate' })
							}
							data={[
								{ value: 'generate', label: 'Сгенерировать' },
								{ value: 'import', label: 'Импорт' },
							]}
						/>
						<TextInput
							label="Название"
							value={draft.name}
							onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
						/>
						{draft.mode === 'generate' ? (
							<SegmentedControl
								value={draft.type}
								onChange={(value) => setDraft({ ...draft, type: value === 'rsa' ? 'rsa' : 'ed25519' })}
								data={[
									{ value: 'ed25519', label: 'Ed25519' },
									{ value: 'rsa', label: 'RSA' },
								]}
							/>
						) : (
							<Textarea
								label="Приватный ключ"
								minRows={6}
								autosize
								value={draft.secret}
								onChange={(event) => setDraft({ ...draft, secret: event.currentTarget.value })}
							/>
						)}
						<PasswordInput
							label="Парольная фраза"
							placeholder="Необязательно"
							value={draft.passphrase}
							onChange={(event) => setDraft({ ...draft, passphrase: event.currentTarget.value })}
						/>
						<Group justify="flex-end">
							<Button variant="default" onClick={() => setDraft(null)}>
								Отмена
							</Button>
							<Button
								loading={saveMutation.isPending}
								onClick={() => {
									if (!draft.name.trim()) {
										notifications.show({ color: 'red', message: 'Укажите название' });
										return;
									}
									if (draft.mode === 'import' && !draft.secret.trim()) {
										notifications.show({ color: 'red', message: 'Вставьте приватный ключ' });
										return;
									}
									saveMutation.mutate(draft);
								}}
							>
								{draft.mode === 'generate' ? 'Сгенерировать' : 'Импортировать'}
							</Button>
						</Group>
					</Stack>
				) : null}
			</Modal>
			<Modal opened={shown !== null} onClose={() => setShown(null)} title={shown?.name ?? 'Ключ'} centered>
				{shown ? (
					<Stack gap="sm">
						<Text size="xs" c="dimmed">
							{shown.type} · {shown.fingerprint}
						</Text>
						<Textarea label="Публичный ключ" readOnly autosize minRows={4} value={shown.public_key} />
						<Group justify="flex-end">
							<Button leftSection={<IconCopy size={14} />} onClick={() => void copyPublic(shown.public_key)}>
								Копировать
							</Button>
						</Group>
					</Stack>
				) : null}
			</Modal>
		</Stack>
	);
}
