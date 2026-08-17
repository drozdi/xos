import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { boardApi, type BoardVisibility } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

interface CreateBoardModalProps {
	workspaceId: number | null;
	opened: boolean;
	onClose: () => void;
}

export function CreateBoardModal({ workspaceId, opened, onClose }: CreateBoardModalProps) {
	const queryClient = useQueryClient();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] = useState<BoardVisibility>('private');

	useEffect(() => {
		if (!opened) {
			setTitle('');
			setDescription('');
			setVisibility('private');
		}
	}, [opened]);

	const createMutation = useMutation({
		mutationFn: () => {
			if (workspaceId === null) {
				throw new Error('no workspace');
			}
			return boardApi.createBoard(workspaceId, {
				title: title.trim(),
				description: description.trim() || null,
				visibility,
			});
		},
		onSuccess: () => {
			if (workspaceId !== null) {
				void queryClient.invalidateQueries({ queryKey: queryKeys.board.workspace(workspaceId) });
				void queryClient.invalidateQueries({ queryKey: queryKeys.board.workspaces });
			}
			onClose();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать доску' });
		},
	});

	const handleSubmit = () => {
		if (!title.trim() || workspaceId === null) {
			return;
		}
		createMutation.mutate();
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Новая доска" centered>
			<Stack gap="md">
				<TextInput
					label="Название"
					placeholder="Sprint board"
					value={title}
					onChange={(event) => setTitle(event.currentTarget.value)}
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
				<Select
					label="Видимость"
					value={visibility}
					onChange={(value) => setVisibility((value as BoardVisibility) ?? 'private')}
					data={[
						{ value: 'private', label: 'Только участники' },
						{ value: 'workspace', label: 'Весь workspace' },
					]}
				/>
				<Group justify="flex-end">
					<Button variant="default" onClick={onClose}>
						Отмена
					</Button>
					<Button
						onClick={handleSubmit}
						loading={createMutation.isPending}
						disabled={!title.trim() || workspaceId === null}
					>
						Создать
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
