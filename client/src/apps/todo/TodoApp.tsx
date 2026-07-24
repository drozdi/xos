import { Alert, Button, Checkbox, Flex, Spin, Typography } from 'antd';
import { notifications } from '@/ui/toast';
import { PlusOutlined } from '@ant-design/icons';
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
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Войдите в систему, чтобы пользоваться заметками"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<div className={classes.root}>
			<div className={classes.toolbar}>
				<Flex justify="space-between" align="center">
					<Typography.Text strong>Заметки</Typography.Text>
					<Button
						size="small"
						icon={<PlusOutlined style={{ fontSize: 14 }} />}
						loading={createMutation.isPending}
						onClick={() => createMutation.mutate()}
					>
						Создать
					</Button>
				</Flex>
			</div>

			<div className={classes.grid}>
				{listsQuery.isLoading ? (
					<div className={classes.empty}>
						<Spin size="small" />
					</div>
				) : null}

				{!listsQuery.isLoading && (listsQuery.data?.length ?? 0) === 0 ? (
					<div className={classes.empty}>
						<Typography.Text>Пока нет списков. Создайте первый.</Typography.Text>
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
								<Checkbox checked={item.done} disabled tabIndex={-1} />
								<span className={item.done ? classes.previewItemDone : undefined}>{item.text}</span>
							</div>
						))}
						{(list.items_count ?? 0) > (list.items_preview?.length ?? 0) ? (
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								ещё {(list.items_count ?? 0) - (list.items_preview?.length ?? 0)}…
							</Typography.Text>
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
