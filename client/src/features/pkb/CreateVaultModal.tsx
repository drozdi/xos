import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

interface CreateVaultModalProps {
	opened: boolean;
	onClose: () => void;
	onCreated?: (vaultId: number) => void;
}

export function CreateVaultModal({ opened, onClose, onCreated }: CreateVaultModalProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState('');

	useEffect(() => {
		if (!opened) {
			setName('');
		}
	}, [opened]);

	const createMutation = useMutation({
		mutationFn: () => pkbApi.createVault({ name: name.trim() }),
		onSuccess: (vault) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vaults });
			void queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vault(vault.id) });
			onCreated?.(vault.id);
			onClose();
			notifications.show({ color: 'green', message: 'Vault создан' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать vault' });
		},
	});

	const handleSubmit = () => {
		if (!name.trim()) {
			return;
		}
		createMutation.mutate();
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Новый vault" centered>
			<Stack gap="md">
				<TextInput
					label="Название"
					placeholder="Моя база знаний"
					value={name}
					onChange={(event) => setName(event.currentTarget.value)}
					required
					data-autofocus
				/>
				<Group justify="flex-end">
					<Button variant="default" onClick={onClose}>
						Отмена
					</Button>
					<Button
						onClick={handleSubmit}
						loading={createMutation.isPending}
						disabled={!name.trim()}
					>
						Создать
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
