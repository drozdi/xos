import {
	Alert,
	Badge,
	Button,
	Group,
	Loader,
	Modal,
	SegmentedControl,
	Stack,
	Table,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { inboxApi } from '@/core/api/endpoints/inboxApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { canUseInbox } from '@/features/inbox/inboxAccess';

export default function InboxApp() {
	useWindowTitle('Inbox');
	const launchApp = useAppManager((s) => s.launchApp);
	const queryClient = useQueryClient();
	const [box, setBox] = useState<'inbox' | 'sent'>('inbox');
	const [composeOpen, setComposeOpen] = useState(false);
	const [toEmail, setToEmail] = useState('');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');

	const listQuery = useQuery({
		queryKey: ['inbox', 'messages', box],
		queryFn: () => inboxApi.list(box),
		enabled: canUseInbox(),
	});

	const createMutation = useMutation({
		mutationFn: () =>
			inboxApi.create({
				to_email: toEmail.trim(),
				subject: subject.trim(),
				body_md: body,
			}),
		onSuccess: () => {
			notifications.show({ color: 'green', message: 'Отправлено' });
			setComposeOpen(false);
			setToEmail('');
			setSubject('');
			setBody('');
			void queryClient.invalidateQueries({ queryKey: ['inbox', 'messages'] });
		},
		onError: (error) => {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось отправить',
			});
		},
	});

	if (!canUseInbox()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нужна роль ROLE_INBOX.
			</Alert>
		);
	}

	return (
		<Stack gap="md" p="md" style={{ minHeight: 0, overflow: 'auto' }}>
			<Group justify="space-between">
				<SegmentedControl
					value={box}
					onChange={(v) => setBox(v as 'inbox' | 'sent')}
					data={[
						{ value: 'inbox', label: 'Входящие' },
						{ value: 'sent', label: 'Отправленные' },
					]}
				/>
				<Button onClick={() => setComposeOpen(true)}>Написать</Button>
			</Group>

			{listQuery.isLoading ? (
				<Loader size="sm" />
			) : listQuery.isError ? (
				<Alert color="red">{extractApiErrorMessage(listQuery.error)}</Alert>
			) : (listQuery.data?.length ?? 0) === 0 ? (
				<Text c="dimmed">Нет сообщений</Text>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: 90 }}>Статус</Table.Th>
							<Table.Th>{box === 'inbox' ? 'От' : 'Кому'}</Table.Th>
							<Table.Th>Тема</Table.Th>
							<Table.Th style={{ width: 150 }}>Дата</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(listQuery.data ?? []).map((row) => {
							const peer = box === 'inbox' ? row.from : row.to;
							return (
								<Table.Tr
									key={row.id}
									style={{ cursor: 'pointer', fontWeight: row.is_unread ? 600 : 400 }}
									onClick={() =>
										void launchApp('inbox-message', {
											instanceKey: String(row.id),
										})
									}
								>
									<Table.Td>
										{row.is_unread ? (
											<Badge size="sm" color="blue">
												Новое
											</Badge>
										) : (
											<Text size="xs" c="dimmed">
												—
											</Text>
										)}
									</Table.Td>
									<Table.Td>{peer.alias || peer.email || peer.id}</Table.Td>
									<Table.Td>{row.subject}</Table.Td>
									<Table.Td>
										<Text size="sm" c="dimmed">
											{row.created_at}
										</Text>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			)}

			<Modal opened={composeOpen} onClose={() => setComposeOpen(false)} title="Новое сообщение">
				<Stack>
					<TextInput
						label="Email получателя"
						value={toEmail}
						onChange={(e) => setToEmail(e.currentTarget.value)}
						required
					/>
					<TextInput
						label="Тема"
						value={subject}
						onChange={(e) => setSubject(e.currentTarget.value)}
						required
					/>
					<Textarea
						label="Текст (Markdown)"
						minRows={6}
						autosize
						value={body}
						onChange={(e) => setBody(e.currentTarget.value)}
					/>
					<Button
						loading={createMutation.isPending}
						onClick={() => createMutation.mutate()}
						disabled={!toEmail.trim() || !subject.trim()}
					>
						Отправить
					</Button>
				</Stack>
			</Modal>
		</Stack>
	);
}
