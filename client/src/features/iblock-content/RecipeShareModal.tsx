import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { iblockElementApi, type IblockElementDetail } from '@/core/api/endpoints/iblockApi';

interface RecipeShareModalProps {
	recipe: IblockElementDetail;
	opened: boolean;
	onClose: () => void;
	onUpdated: (recipe: IblockElementDetail) => void;
}

export function RecipeShareModal({ recipe, opened, onClose, onUpdated }: RecipeShareModalProps) {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState('');
	const [lookupError, setLookupError] = useState<string | null>(null);

	const shareMutation = useMutation({
		mutationFn: () => iblockElementApi.share(recipe.id, email.trim()),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: ['iblock'] });
			setEmail('');
			setLookupError(null);
			notifications.show({ color: 'green', message: 'Доступ для просмотра выдан' });
		},
		onError: () => {
			setLookupError('Не удалось поделиться. Проверьте email.');
		},
	});

	const unshareMutation = useMutation({
		mutationFn: (userId: number) => iblockElementApi.unshare(recipe.id, userId),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: ['iblock'] });
		},
	});

	return (
		<Modal opened={opened} onClose={onClose} title="Поделиться рецептом" centered>
			<Stack gap="sm">
				<Text size="sm" c="dimmed">
					Доступ только для просмотра. Укажите email пользователя XOS.
				</Text>
				<TextInput
					label="Email"
					placeholder="user@example.com"
					value={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
				/>
				{lookupError ? <Alert color="red">{lookupError}</Alert> : null}
				<Button
					onClick={() => {
						if (!email.trim()) {
							setLookupError('Укажите email');
							return;
						}
						shareMutation.mutate();
					}}
					loading={shareMutation.isPending}
				>
					Поделиться
				</Button>

				{(recipe.shares ?? []).length > 0 ? (
					<Stack gap={6}>
						<Text fw={600} size="sm">
							Уже есть доступ
						</Text>
						{(recipe.shares ?? []).map((share) => (
							<Group key={share.user_id ?? share.email} justify="space-between" wrap="nowrap">
								<div>
									<Text size="sm">{share.alias || share.email}</Text>
									<Text size="xs" c="dimmed">
										{share.email} · просмотр
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
				) : null}
			</Stack>
		</Modal>
	);
}
