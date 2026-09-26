import { Alert, Button, Checkbox, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { pkbApi, type PkbVaultDetail } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

import { listPkbPlugins } from './plugins/pkbPlugins';

interface VaultSettingsModalProps {
	vault: PkbVaultDetail;
	opened: boolean;
	onClose: () => void;
}

export function VaultSettingsModal({ vault, opened, onClose }: VaultSettingsModalProps) {
	const queryClient = useQueryClient();
	const [encryptAtRest, setEncryptAtRest] = useState(vault.encrypt_at_rest ?? false);
	const [plugins, setPlugins] = useState<string[]>(vault.plugins ?? []);
	const [remoteSyncUrl, setRemoteSyncUrl] = useState(vault.remote_sync_url ?? '');

	useEffect(() => {
		if (!opened) {
			return;
		}
		setEncryptAtRest(vault.encrypt_at_rest ?? false);
		setPlugins(vault.plugins ?? []);
		setRemoteSyncUrl(vault.remote_sync_url ?? vault.config?.remote_sync_url ?? '');
	}, [opened, vault.encrypt_at_rest, vault.plugins, vault.remote_sync_url, vault.config?.remote_sync_url]);

	const saveMutation = useMutation({
		mutationFn: () =>
			pkbApi.updateVault(vault.id, {
				encrypt_at_rest: encryptAtRest,
				plugins,
				remote_sync_url: remoteSyncUrl.trim() || null,
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vault(vault.id) });
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vaults });
			notifications.show({ color: 'green', message: 'Настройки vault сохранены' });
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Не удалось сохранить настройки vault'),
	});

	const syncMutation = useMutation({
		mutationFn: () => pkbApi.pushRemoteSync(vault.id),
		onSuccess: (result) => {
			notifications.show({
				color: result.ok ? 'green' : 'yellow',
				message: result.ok
					? `Remote sync OK (${result.bytes} байт, HTTP ${result.status})`
					: `Remote sync ответил HTTP ${result.status}`,
			});
		},
		onError: (error) => notifyApiError(error, 'Не удалось выполнить remote sync'),
	});

	const availablePlugins = listPkbPlugins();
	const canPush = Boolean((vault.remote_sync_url ?? remoteSyncUrl).trim());

	return (
		<Modal opened={opened} onClose={onClose} title="Настройки vault" centered>
			<Stack gap="md">
				<Checkbox
					label="Шифрование заметок at rest"
					description="Требует PKB_AT_REST_SECRET на сервере. Тела .md шифруются на диске; excerpt в индексе — [encrypted]."
					checked={encryptAtRest}
					onChange={(event) => setEncryptAtRest(event.currentTarget.checked)}
				/>
				{encryptAtRest ? (
					<Alert color="yellow" title="Ключ шифрования">
						Без того же секрета на сервере заметки нельзя будет расшифровать. Храните
						PKB_AT_REST_SECRET в безопасном месте.
					</Alert>
				) : null}

				<Stack gap="xs">
					<Text size="sm" fw={500}>
						Плагины
					</Text>
					{availablePlugins.map((plugin) => (
						<Checkbox
							key={plugin.id}
							label={plugin.name}
							description={plugin.description}
							checked={plugins.includes(plugin.id)}
							onChange={(event) => {
								const checked = event.currentTarget.checked;
								setPlugins((prev) =>
									checked
										? [...new Set([...prev, plugin.id])]
										: prev.filter((id) => id !== plugin.id),
								);
							}}
						/>
					))}
				</Stack>

				<TextInput
					label="Remote sync URL"
					description="POST ZIP (multipart field vault) на этот URL. Пусто — отключено."
					placeholder="https://example.com/hooks/pkb"
					value={remoteSyncUrl}
					onChange={(e) => setRemoteSyncUrl(e.currentTarget.value)}
				/>

				<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
					Сохранить
				</Button>
				<Button
					variant="light"
					disabled={!canPush}
					loading={syncMutation.isPending}
					onClick={() => syncMutation.mutate()}
				>
					Push ZIP сейчас
				</Button>
			</Stack>
		</Modal>
	);
}
