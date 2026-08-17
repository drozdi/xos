import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

interface CreateWorkspaceModalProps {
	opened: boolean;
	onClose: () => void;
	onCreated?: (workspaceId: number) => void;
}

export function CreateWorkspaceModal({ opened, onClose, onCreated }: CreateWorkspaceModalProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	useEffect(() => {
		if (!opened) {
			setName('');
			setDescription('');
		}
	}, [opened]);

	const createMutation = useMutation({
		mutationFn: () =>
			boardApi.createWorkspace({
				name: name.trim(),
				description: description.trim() || null,
			}),
		onSuccess: (workspace) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.board.workspaces });
			void queryClient.invalidateQueries({ queryKey: queryKeys.board.workspace(workspace.id) });
			onCreated?.(workspace.id);
			onClose();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать workspace' });
		},
	});

	const handleSubmit = () => {
		if (!name.trim()) {
			return;
		}
		createMutation.mutate();
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Новый workspace" centered>
			<Stack gap="md">
				<TextInput
					label="Название"
					placeholder="Мой workspace"
					value={name}
					onChange={(event) => setName(event.currentTarget.value)}
					required
					data-autofocus
				/>
				<Textarea
					label="Описание"
					placeholder="Необязательно"
					value={description}
					onChange={(event) => setDescription(event.currentTarget.value)}
					minRows={2}
					autosize
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
