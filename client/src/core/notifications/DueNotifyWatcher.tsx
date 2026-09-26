import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import { todoApi } from '@/core/api/endpoints/todoApi';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';
import { canUseTodo } from '@/features/todo/todoAccess';

/** Polls todo due window and feeds shell notification center + toast. */
export function DueNotifyWatcher() {
	const push = useShellNotifications((s) => s.push);
	const enabled = canUseTodo();

	const start = dayjs().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
	const end = dayjs().add(24, 'hour').format('YYYY-MM-DDTHH:mm:ss');

	const dueQuery = useQuery({
		queryKey: ['shell', 'todo-due', start.slice(0, 13)],
		queryFn: () => todoApi.dueItems(start, end),
		enabled,
		refetchInterval: 60_000,
		staleTime: 30_000,
	});

	useEffect(() => {
		const items = dueQuery.data ?? [];
		const now = dayjs();
		for (const item of items) {
			if (!item.due_at || item.done) continue;
			const due = dayjs(item.due_at);
			if (!due.isValid()) continue;
			const hours = due.diff(now, 'hour', true);
			if (hours > 2 || hours < -24) continue;
			const overdue = hours < 0;
			const launchPayload = {
				appId: 'todo' as const,
				instanceKey: String(item.list_id ?? 0),
				props: { listId: item.list_id } as Record<string, unknown>,
			};
			const added = push({
				kind: 'todo_due',
				title: overdue ? 'Просрочено' : 'Скоро срок',
				body: item.text || 'Задача',
				dedupeKey: `todo-due:${item.id}`,
				launch: launchPayload,
			});
			if (added) {
				notifications.show({
					color: overdue ? 'red' : 'yellow',
					title: overdue ? 'Просрочено' : 'Скоро срок',
					message: item.text || 'Задача',
				});
			}
		}
	}, [dueQuery.data, push]);

	return null;
}
