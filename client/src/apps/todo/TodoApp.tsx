import { Alert, Button, Checkbox, Group, Loader, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { todoApi } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { TodoListEditorModal } from '@/features/todo/TodoListEditorModal';
import { canUseTodo } from '@/features/todo/todoAccess';
import { TODO_COLORS } from '@/features/todo/todoMarkdown';

import classes from './todo.module.css';

export default function TodoApp() {
	useWindowTitle('Заметки');
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const listsQuery = useQuery({
		queryKey: queryKeys.todo.lists,
		queryFn: () => todoApi.lists(),
		enabled: canUseTodo(),
	});

	const createMutation = useMutation({
		mutationFn: () =>
			todoApi.create({
				title: 'Новый список',
				color: TODO_COLORS[Math.floor(Math.random() * TODO_COLORS.length)],
				markdown: '- [ ] ',
			}),
		onSuccess: (list) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			setSelectedId(list.id);
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать список' });
		},
	});

	if (!canUseTodo()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Войдите в систему, чтобы пользоваться заметками
			</Alert>
		);
	}

	return (
		<div className={classes.root}>
			<div className={classes.toolbar}>
				<Group justify="space-between">
					<Text fw={600}>Заметки</Text>
					<Button
						size="xs"
						leftSection={<IconPlus size={14} />}
						loading={createMutation.isPending}
						onClick={() => createMutation.mutate()}
					>
						Создать
					</Button>
				</Group>
			</div>

			<div className={classes.grid}>
				{listsQuery.isLoading ? (
					<div className={classes.empty}>
						<Loader size="sm" />
					</div>
				) : null}

				{!listsQuery.isLoading && (listsQuery.data?.length ?? 0) === 0 ? (
					<div className={classes.empty}>
						<Text>Пока нет списков. Создайте первый.</Text>
					</div>
				) : null}

				{listsQuery.data?.map((list) => (
					<button
						key={list.id}
						type="button"
						className={classes.card}
						style={{ background: list.color }}
						onClick={() => setSelectedId(list.id)}
					>
						<div className={classes.cardTitle}>{list.title}</div>
						{(list.items_preview ?? []).map((item, index) => (
							<div key={item.id ?? index} className={classes.previewItem}>
								<Checkbox size="xs" checked={item.done} readOnly tabIndex={-1} />
								<span className={item.done ? classes.previewItemDone : undefined}>{item.text}</span>
							</div>
						))}
						{(list.items_count ?? 0) > (list.items_preview?.length ?? 0) ? (
							<Text size="xs" c="dimmed">
								ещё {(list.items_count ?? 0) - (list.items_preview?.length ?? 0)}…
							</Text>
						) : null}
						<div className={classes.cardMeta}>
							{list.is_owner ? 'Мой' : `От ${list.owner?.alias ?? 'другого'}`}
							{list.can_write ? '' : ' · только просмотр'}
						</div>
					</button>
				))}
			</div>

			<TodoListEditorModal
				listId={selectedId}
				opened={selectedId !== null}
				onClose={() => setSelectedId(null)}
			/>
		</div>
	);
}
