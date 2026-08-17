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

import { pkbApi, type PkbVaultMember } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

interface ShareVaultModalProps {
	vaultId: number;
	opened: boolean;
	canManageMembers: boolean;
	onClose: () => void;
}

const ROLE_OPTIONS = [
	{ value: 'reader', label: 'Читатель' },
	{ value: 'editor', label: 'Редактор' },
];

function memberLabel(member: PkbVaultMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

export function ShareVaultModal({ vaultId, opened, canManageMembers, onClose }: ShareVaultModalProps) {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState('');
	const [role, setRole] = useState<string>('reader');
	const [error, setError] = useState<string | null>(null);

	const membersQuery = useQuery({
		queryKey: queryKeys.pkb.members(vaultId),
		queryFn: () => pkbApi.listVaultMembers(vaultId),
		enabled: opened && canManageMembers,
	});

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.members(vaultId) });
		await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vault(vaultId) });
		await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vaults });
	};

	const inviteMutation = useMutation({
		mutationFn: () => pkbApi.inviteVaultMember(vaultId, { email: email.trim(), role }),
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
			pkbApi.updateVaultMember(vaultId, userId, nextRole),
		onSuccess: () => invalidate(),
	});

	const removeMutation = useMutation({
		mutationFn: (userId: number) => pkbApi.removeVaultMember(vaultId, userId),
		onSuccess: () => invalidate(),
	});

	const members = membersQuery.data ?? [];

	return (
		<Modal opened={opened} onClose={onClose} title="Доступ к vault" centered size="md">
			<Stack gap="sm">
				{canManageMembers ? (
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
						<Select label="Роль" data={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v ?? 'reader')} />
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
						Управление участниками доступно только владельцу vault.
					</Text>
				)}

				{canManageMembers && membersQuery.isLoading ? (
					<Text size="sm" c="dimmed">
						Загрузка…
					</Text>
				) : canManageMembers && members.length === 0 ? (
					<Text size="sm" c="dimmed">
						Пока нет участников
					</Text>
				) : canManageMembers ? (
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
								{member.is_owner ? (
									<Text size="xs" c="dimmed">
										владелец
									</Text>
								) : member.user_id ? (
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
				) : null}
			</Stack>
		</Modal>
	);
}
