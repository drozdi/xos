import {
	ActionIcon,
	Alert,
	Button,
	Divider,
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
	const [groupCode, setGroupCode] = useState('');
	const [userPermission, setUserPermission] = useState<'read' | 'write'>('write');
	const [groupPermission, setGroupPermission] = useState<'read' | 'write'>('read');
	const [lookupError, setLookupError] = useState<string | null>(null);
	const [groupError, setGroupError] = useState<string | null>(null);

	const shareMutation = useMutation({
		mutationFn: () => calendarApi.share(calendar.id, email.trim(), userPermission),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
			setEmail('');
			setLookupError(null);
			notifications.show({ color: 'green', message: 'Доступ пользователю выдан' });
		},
		onError: () => {
			setLookupError('Не удалось поделиться. Проверьте email.');
		},
	});

	const shareGroupMutation = useMutation({
		mutationFn: () =>
			calendarApi.shareGroup(calendar.id, {
				code: groupCode.trim(),
				permission: groupPermission,
			}),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
			setGroupCode('');
			setGroupError(null);
			notifications.show({ color: 'green', message: 'Доступ группе выдан' });
		},
		onError: () => {
			setGroupError('Не удалось поделиться с группой. Проверьте код.');
		},
	});

	const unshareMutation = useMutation({
		mutationFn: (userId: number) => calendarApi.unshare(calendar.id, userId),
		onSuccess: (data) => {
			onUpdated(data);
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
		},
	});

	const unshareGroupMutation = useMutation({
		mutationFn: (groupId: number) => calendarApi.unshareGroup(calendar.id, groupId),
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

	const handleGroupShare = async () => {
		setGroupError(null);
		const trimmed = groupCode.trim();
		if (!trimmed) {
			setGroupError('Укажите код группы');
			return;
		}
		try {
			await calendarApi.findGroupByCode(trimmed);
			shareGroupMutation.mutate();
		} catch {
			setGroupError('Группа с таким кодом не найдена');
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Поделиться календарём" centered size="md">
			<Stack gap="sm">
				<Text size="sm" c="dimmed">
					Пользователь по email или группа по коду. Для группы по умолчанию — просмотр;
					личный share пользователя перекрывает права группы.
				</Text>

				<Text fw={600} size="sm">
					Пользователь
				</Text>
				<TextInput
					label="Email"
					placeholder="user@example.com"
					value={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
				/>
				<Radio.Group
					label="Права"
					value={userPermission}
					onChange={(v) => setUserPermission(v as 'read' | 'write')}
				>
					<Group mt="xs">
						<Radio value="read" label="Просмотр" />
						<Radio value="write" label="Редактирование" />
					</Group>
				</Radio.Group>
				{lookupError ? <Alert color="red">{lookupError}</Alert> : null}
				<Button onClick={() => void handleLookupAndShare()} loading={shareMutation.isPending}>
					Поделиться с пользователем
				</Button>

				{calendar.shares.length > 0 ? (
					<Stack gap={6}>
						{calendar.shares.map((share) => (
							<Group key={share.user_id ?? share.email} justify="space-between" wrap="nowrap">
								<div>
									<Text size="sm">{share.alias || share.email}</Text>
									<Text size="xs" c="dimmed">
										{share.email} ·{' '}
										{share.permission === 'write' ? 'редактирование' : 'просмотр'}
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

				<Divider my="xs" />

				<Text fw={600} size="sm">
					Группа
				</Text>
				<TextInput
					label="Код группы"
					placeholder="например teachers"
					value={groupCode}
					onChange={(e) => setGroupCode(e.currentTarget.value)}
				/>
				<Radio.Group
					label="Права участников группы"
					value={groupPermission}
					onChange={(v) => setGroupPermission(v as 'read' | 'write')}
				>
					<Group mt="xs">
						<Radio value="read" label="Просмотр" />
						<Radio value="write" label="Редактирование" />
					</Group>
				</Radio.Group>
				{groupError ? <Alert color="red">{groupError}</Alert> : null}
				<Button
					onClick={() => void handleGroupShare()}
					loading={shareGroupMutation.isPending}
				>
					Поделиться с группой
				</Button>

				{(calendar.group_shares ?? []).length > 0 ? (
					<Stack gap={6}>
						{(calendar.group_shares ?? []).map((share) => (
							<Group
								key={share.group_id ?? share.code}
								justify="space-between"
								wrap="nowrap"
							>
								<div>
									<Text size="sm">{share.name || share.code}</Text>
									<Text size="xs" c="dimmed">
										{share.code} ·{' '}
										{share.permission === 'write' ? 'редактирование' : 'просмотр'}
									</Text>
								</div>
								{share.group_id ? (
									<ActionIcon
										variant="subtle"
										color="red"
										aria-label="Отозвать группу"
										loading={unshareGroupMutation.isPending}
										onClick={() => unshareGroupMutation.mutate(share.group_id!)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								) : null}
							</Group>
						))}
					</Stack>
				) : null}

				<Button variant="default" onClick={onClose}>
					Закрыть
				</Button>
			</Stack>
		</Modal>
	);
}
