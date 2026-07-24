import { Alert, Button, Flex, Input, Modal, Radio, Space, Typography } from 'antd';
import { notifications } from '@/ui/toast';
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
		<Modal open={opened} onCancel={onClose} title="Поделиться списком" centered footer={null} destroyOnHidden>
			<Flex vertical gap={12}>
				<Typography.Text type="secondary" style={{ fontSize: 14 }}>
					Найдите пользователя по email и выдайте доступ.
				</Typography.Text>
				<div>
					<Typography.Text style={{ display: 'block', marginBottom: 4 }}>Email</Typography.Text>
					<Input
						placeholder="user@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>
				<div>
					<Typography.Text style={{ display: 'block', marginBottom: 4 }}>Права</Typography.Text>
					<Radio.Group
						value={permission}
						onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
					>
						<Space>
							<Radio value="read">Просмотр</Radio>
							<Radio value="write">Редактирование</Radio>
						</Space>
					</Radio.Group>
				</div>
				{lookupError ? <Alert type="error" showIcon message={lookupError} /> : null}
				<Button type="primary" onClick={() => void handleLookupAndShare()} loading={shareMutation.isPending}>
					Поделиться
				</Button>

				{list.shares.length > 0 ? (
					<Flex vertical gap={6}>
						<Typography.Text strong style={{ fontSize: 14 }}>
							Уже есть доступ
						</Typography.Text>
						{list.shares.map((share) => (
							<Flex key={share.user_id ?? share.email} justify="space-between" align="center" wrap="nowrap">
								<div>
									<Typography.Text style={{ fontSize: 14 }}>{share.alias || share.email}</Typography.Text>
									<br />
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{share.email} · {share.permission === 'write' ? 'редактирование' : 'просмотр'}
									</Typography.Text>
								</div>
								{share.user_id ? (
									<Button
										type="text"
										danger
										aria-label="Отозвать"
										loading={unshareMutation.isPending}
										icon={<IconTrash size={16} />}
										onClick={() => unshareMutation.mutate(share.user_id!)}
									/>
								) : null}
							</Flex>
						))}
					</Flex>
				) : (
					<Typography.Text type="secondary" style={{ fontSize: 14 }}>
						Пока ни с кем не поделились
					</Typography.Text>
				)}
				<Button onClick={onClose}>Закрыть</Button>
			</Flex>
		</Modal>
	);
}
