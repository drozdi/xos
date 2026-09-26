import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { inboxApi } from '@/core/api/endpoints/inboxApi';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MarkdownPreview } from '@/features/markdown';
import { canUseInbox } from '@/features/inbox/inboxAccess';

export default function InboxMessageApp() {
	const { instanceKey } = useAppContext();
	const id = Number.parseInt(String(instanceKey), 10);
	const queryClient = useQueryClient();
	useWindowTitle(id > 0 ? `Сообщение #${id}` : 'Сообщение');

	const detailQuery = useQuery({
		queryKey: ['inbox', 'message', id],
		queryFn: () => inboxApi.get(id),
		enabled: canUseInbox() && id > 0,
	});

	const deleteMutation = useMutation({
		mutationFn: () => inboxApi.remove(id),
		onSuccess: () => {
			notifications.show({ color: 'green', message: 'Удалено' });
			void queryClient.invalidateQueries({ queryKey: ['inbox', 'messages'] });
		},
		onError: (error) => {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось удалить',
			});
		},
	});

	if (!canUseInbox()) {
		return (
			<Alert color="red" m="md">
				Нет доступа
			</Alert>
		);
	}

	if (!id) {
		return (
			<Alert color="yellow" m="md">
				Откройте сообщение из списка Inbox
			</Alert>
		);
	}

	if (detailQuery.isLoading) {
		return <Loader m="md" />;
	}

	if (detailQuery.isError || !detailQuery.data) {
		return (
			<Alert color="red" m="md">
				{extractApiErrorMessage(detailQuery.error) || 'Не найдено'}
			</Alert>
		);
	}

	const msg = detailQuery.data;

	return (
		<Stack p="md" gap="md" style={{ minHeight: 0, overflow: 'auto' }}>
			<Group justify="space-between">
				<Stack gap={2}>
					<Text fw={700} size="lg">
						{msg.subject}
					</Text>
					<Text size="sm" c="dimmed">
						От: {msg.from.alias || msg.from.email} · Кому: {msg.to.alias || msg.to.email} ·{' '}
						{msg.created_at}
					</Text>
				</Stack>
				<Button color="red" variant="light" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
					Удалить
				</Button>
			</Group>
			<MarkdownPreview content={msg.body_md || ''} />
		</Stack>
	);
}
