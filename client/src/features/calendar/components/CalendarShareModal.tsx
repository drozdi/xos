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

import { calendarApi, type CalendarDto } from '@/core/api/endpoints/calendarApi';
import { queryKeys } from '@/core/api/queryKeys';

interface CalendarShareModalProps {
	calendar: CalendarDto;
	opened: boolean;
	onClose: () => void;
	onUpdated: (calendar: CalendarDto) => void;
}

export function CalendarShareModal({
	calendar,
	opened,
	onClose,
	onUpdated,
}: CalendarShareModalProps) {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState('');
	const [permission, setPermission] = useState<'read' | 'write'>('write');
	const [lookupError, setLookupError] = useState<string | null>(null);

	const shareMutation = useMutation({
		mutationFn: () => calendarApi.share(calendar.id, email.trim(), permission),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
			setEmail('');
			setLookupError(null);
			notifications.show({ color: 'green', message: 'Доступ выдан' });
		},
		onError: () => {
			setLookupError('Не удалось поделиться. Проверьте email.');
		},
	});

	const unshareMutation = useMutation({
		mutationFn: (userId: number) => calendarApi.unshare(calendar.id, userId),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
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
			await calendarApi.findUserByEmail(trimmed);
			shareMutation.mutate();
		} catch {
			setLookupError('Пользователь с таким email не найден');
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Поделиться календарём" centered>
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
				<Button onClick={() => void handleLookupAndShare()} loading={shareMutation.isPending}>
					Поделиться
				</Button>

				{calendar.shares.length > 0 ? (
					<Stack gap={6}>
						<Text fw={600} size="sm">
							Уже есть доступ
						</Text>
						{calendar.shares.map((share) => (
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
