import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { boardApi, type BoardMember } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

interface MemberInviteModalProps {
	boardId: number;
	opened: boolean;
	canAdmin: boolean;
	onClose: () => void;
}

const ROLE_OPTIONS = [
	{ value: 'admin', label: 'Админ' },
	{ value: 'editor', label: 'Редактор' },
	{ value: 'observer', label: 'Наблюдатель' },
];

function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

export function MemberInviteModal({ boardId, opened, canAdmin, onClose }: MemberInviteModalProps) {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState('');
	const [role, setRole] = useState<string>('editor');
	const [error, setError] = useState<string | null>(null);

	const membersQuery = useQuery({
		queryKey: queryKeys.board.members(boardId),
		queryFn: () => boardApi.listBoardMembers(boardId),
		enabled: opened,
	});

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.board.members(boardId) });
		await queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
	};

	const inviteMutation = useMutation({
		mutationFn: () => boardApi.addBoardMember(boardId, email.trim(), role),
		onSuccess: async () => {
			setEmail('');
			setError(null);
			await invalidate();
			notifications.show({ color: 'green', message: 'Участник добавлен' });
		},
		onError: () => setError('Не удалось добавить участника. Проверьте email.'),
	});

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, nextRole }: { userId: number; nextRole: string }) =>
			boardApi.updateBoardMember(boardId, userId, nextRole),
		onSuccess: () => invalidate(),
	});

	const removeMutation = useMutation({
		mutationFn: (userId: number) => boardApi.removeBoardMember(boardId, userId),
		onSuccess: () => invalidate(),
	});

	const members = membersQuery.data ?? [];

	return (
		<Modal opened={opened} onClose={onClose} title="Участники доски" centered size="md">
			<Stack gap="sm">
				{canAdmin ? (
					<>
						<Text size="sm" c="dimmed">
							Пригласите пользователя по email.
						</Text>
						<TextInput
							label="Email"
							placeholder="user@example.com"
							value={email}
							onChange={(e) => setEmail(e.currentTarget.value)}
						/>
						<Select label="Роль" data={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v ?? 'editor')} />
						{error ? <Alert color="red">{error}</Alert> : null}
						<Button
							onClick={() => inviteMutation.mutate()}
							loading={inviteMutation.isPending}
							disabled={!email.trim()}
						>
							Пригласить
						</Button>
					</>
				) : (
					<Text size="sm" c="dimmed">
						Список участников доски.
					</Text>
				)}

				{membersQuery.isLoading ? (
					<Text size="sm" c="dimmed">
						Загрузка…
					</Text>
				) : members.length === 0 ? (
					<Text size="sm" c="dimmed">
						Пока нет участников
					</Text>
				) : (
					<Stack gap={6}>
						<Text fw={600} size="sm">
							Участники
						</Text>
						{members.map((member) => (
							<Group key={member.user_id ?? member.email} justify="space-between" wrap="nowrap">
								<div>
									<Text size="sm">{memberLabel(member)}</Text>
									{member.email ? (
										<Text size="xs" c="dimmed">
											{member.email}
										</Text>
									) : null}
								</div>
								{canAdmin && member.user_id ? (
									<Group gap="xs" wrap="nowrap">
										<Select
											size="xs"
											w={120}
											data={ROLE_OPTIONS}
											value={member.role}
											onChange={(v) => {
												if (v) {
													updateRoleMutation.mutate({ userId: member.user_id!, nextRole: v });
												}
											}}
										/>
										<ActionIcon
											variant="subtle"
											color="red"
											aria-label="Удалить"
											loading={removeMutation.isPending}
											onClick={() => removeMutation.mutate(member.user_id!)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								) : (
									<Text size="xs" c="dimmed">
										{member.role}
									</Text>
								)}
							</Group>
						))}
					</Stack>
				)}
			</Stack>
		</Modal>
	);
}
