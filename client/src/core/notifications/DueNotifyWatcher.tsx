import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { inboxApi } from '@/core/api/endpoints/inboxApi';
import { todoApi } from '@/core/api/endpoints/todoApi';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';
import { canUseBoard } from '@/features/board/boardAccess';
import { canUseInbox } from '@/features/inbox/inboxAccess';
import { canUseTodo } from '@/features/todo/todoAccess';

const POLL_MS = 60_000;

/** Polls todo, board dues and unread inbox into the shell notification feed. */
export function DueNotifyWatcher() {
	const push = useShellNotifications((s) => s.push);
	const enabled = canUseTodo();
	const boardEnabled = canUseBoard();
	const inboxEnabled = canUseInbox();

	const start = dayjs().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
	const end = dayjs().add(24, 'hour').format('YYYY-MM-DDTHH:mm:ss');

	const dueQuery = useQuery({
		queryKey: ['shell', 'todo-due', start.slice(0, 13)],
		queryFn: () => todoApi.dueItems(start, end),
		enabled,
		refetchInterval: POLL_MS,
		refetchOnWindowFocus: false,
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

	const boardQuery = useQuery({
		queryKey: ['shell', 'board-due', start.slice(0, 13)],
		queryFn: () => boardApi.dueCards(start, end),
		enabled: boardEnabled,
		refetchInterval: POLL_MS,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});

	useEffect(() => {
		const now = dayjs();
		for (const card of boardQuery.data ?? []) {
			if (!card.due_date) {
				continue;
			}
			const due = dayjs(card.due_date);
			if (!due.isValid()) {
				continue;
			}
			const hours = due.diff(now, 'hour', true);
			if (hours > 2 || hours < -24) {
				continue;
			}
			const overdue = hours < 0;
			const added = push({
				kind: 'board_due',
				title: overdue ? 'Карточка просрочена' : 'Срок карточки',
				body: card.title,
				dedupeKey: `board-due:${card.id}`,
				launch: {
					appId: 'board',
					instanceKey: 'default',
					props: { boardId: card.board_id ?? undefined },
				},
			});
			if (added) {
				notifications.show({
					color: overdue ? 'red' : 'yellow',
					title: overdue ? 'Карточка просрочена' : 'Срок карточки',
					message: card.title,
				});
			}
		}
	}, [boardQuery.data, push]);

	const inboxQuery = useQuery({
		// Same key as InboxApp: one request feeds both, and inbox mutations refresh the feed.
		queryKey: ['inbox', 'messages', 'inbox'],
		queryFn: () => inboxApi.list('inbox'),
		enabled: inboxEnabled,
		refetchInterval: POLL_MS,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});

	useEffect(() => {
		for (const message of inboxQuery.data ?? []) {
			if (!message.is_unread) {
				continue;
			}
			const added = push({
				kind: 'inbox',
				title: 'Новое сообщение',
				body: message.subject || 'Без темы',
				dedupeKey: `inbox:${message.id}`,
				launch: {
					appId: 'inbox-message',
					instanceKey: String(message.id),
				},
			});
			if (added) {
				notifications.show({
					color: 'blue',
					title: 'Новое сообщение',
					message: message.subject || 'Без темы',
				});
			}
		}
	}, [inboxQuery.data, push]);

	return null;
}
