import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Modal,
	Radio,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { todoApi, type TodoListDetail } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';

interface TodoShareModalProps {
	list: TodoListDetail;
	opened: boolean;
	onClose: () => void;
	onUpdated: (list: TodoListDetail) => void;
}

export function TodoShareModal({ list, opened, onClose, onUpdated }: TodoShareModalProps) {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState('');
	const [permission, setPermission] = useState<'read' | 'write'>('write');
	const [lookupError, setLookupError] = useState<string | null>(null);

	const shareMutation = useMutation({
		mutationFn: () => todoApi.share(list.id, email.trim(), permission),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			setEmail('');
			setLookupError(null);
			notifications.show({ color: 'green', message: 'Доступ выдан' });
		},
		onError: () => {
			setLookupError('Не удалось поделиться. Проверьте email.');
		},
	});

	const unshareMutation = useMutation({
		mutationFn: (userId: number) => todoApi.unshare(list.id, userId),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
		},
	});

	const handleLookupAndShare = async () => {
		setLookupError(null);
		const trimmed = email.trim();
		if (!trimmed) {
			setLookupError('Укажите email');
			return;
		}
		try {
			await todoApi.findUserByEmail(trimmed);
			shareMutation.mutate();
		} catch {
			setLookupError('Пользователь с таким email не найден');
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Поделиться списком" centered>
			<Stack gap="sm">
				<Text size="sm" c="dimmed">
					Найдите пользователя по email и выдайте доступ.
				</Text>
				<TextInput
					label="Email"
					placeholder="user@example.com"
					value={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
				/>
				<Radio.Group
					label="Права"
					value={permission}
					onChange={(v) => setPermission(v as 'read' | 'write')}
				>
					<Group mt="xs">
						<Radio value="read" label="Просмотр" />
						<Radio value="write" label="Редактирование" />
					</Group>
				</Radio.Group>
				{lookupError ? <Alert color="red">{lookupError}</Alert> : null}
				<Button
					onClick={() => void handleLookupAndShare()}
					loading={shareMutation.isPending}
				>
					Поделиться
				</Button>

				{list.shares.length > 0 ? (
					<Stack gap={6}>
						<Text fw={600} size="sm">
							Уже есть доступ
						</Text>
						{list.shares.map((share) => (
							<Group key={share.user_id ?? share.email} justify="space-between" wrap="nowrap">
								<div>
									<Text size="sm">{share.alias || share.email}</Text>
									<Text size="xs" c="dimmed">
										{share.email} · {share.permission === 'write' ? 'редактирование' : 'просмотр'}
									</Text>
								</div>
								{share.user_id ? (
									<ActionIcon
										variant="subtle"
										color="red"
										aria-label="Отозвать"
										loading={unshareMutation.isPending}
										onClick={() => unshareMutation.mutate(share.user_id!)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								) : null}
							</Group>
						))}
					</Stack>
				) : (
					<Text size="sm" c="dimmed">
						Пока ни с кем не поделились
					</Text>
				)}
				<Button variant="default" onClick={onClose}>
					Закрыть
				</Button>
			</Stack>
		</Modal>
	);
}
