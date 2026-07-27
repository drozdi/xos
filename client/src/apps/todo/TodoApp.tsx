import {
	Alert,
	Button,
	Card,
	Checkbox,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
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
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
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

			<SimpleGrid
				cols={{ base: 1, xs: 2, sm: 3, md: 4 }}
				spacing="md"
				p="md"
				style={{ flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'start' }}
			>
				{listsQuery.isLoading ? (
					<Group justify="center" py="xl" style={{ gridColumn: '1 / -1' }}>
						<Loader size="sm" />
					</Group>
				) : null}

				{!listsQuery.isLoading && (listsQuery.data?.length ?? 0) === 0 ? (
					<Text ta="center" c="dimmed" py="xl" style={{ gridColumn: '1 / -1' }}>
						Пока нет списков. Создайте первый.
					</Text>
				) : null}

				{listsQuery.data?.map((list) => (
					<Card
						key={list.id}
						padding="md"
						radius="md"
						withBorder
						shadow="sm"
						style={{
							cursor: 'pointer',
							minHeight: 120,
							borderTopWidth: 3,
							borderTopColor: list.color,
						}}
						onClick={() => setSelectedId(list.id)}
					>
						<Stack gap="xs" h="100%">
							<Text fw={600} size="sm" lineClamp={2}>
								{list.title}
							</Text>
							{(list.items_preview ?? []).map((item, index) => (
								<Group key={item.id ?? index} gap="xs" wrap="nowrap" align="flex-start">
									<Checkbox size="xs" checked={item.done} readOnly tabIndex={-1} mt={2} />
									<Text
										size="sm"
										td={item.done ? 'line-through' : undefined}
										c={item.done ? 'dimmed' : undefined}
										lineClamp={2}
									>
										{item.text}
									</Text>
								</Group>
							))}
							{(list.items_count ?? 0) > (list.items_preview?.length ?? 0) ? (
								<Text size="xs" c="dimmed">
									ещё {(list.items_count ?? 0) - (list.items_preview?.length ?? 0)}…
								</Text>
							) : null}
							<Text size="xs" c="dimmed" mt="auto">
								{list.is_owner ? 'Мой' : `От ${list.owner?.alias ?? 'другого'}`}
								{list.can_write ? '' : ' · только просмотр'}
							</Text>
						</Stack>
					</Card>
				))}
			</SimpleGrid>

			<TodoListEditorModal
				listId={selectedId}
				opened={selectedId !== null}
				onClose={() => setSelectedId(null)}
			/>
		</Stack>
	);
}
