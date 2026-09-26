import {
	Alert,
	Button,
	Checkbox,
	Group,
	Loader,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { userDataApi } from '@/core/api/endpoints/userData';
import { todoApi, type TodoListDetail } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	computeStreak,
	formatDayKey,
	habitDisplayName,
	HABITS_STREAK_CODE,
	isHabitListTitle,
	toHabitListTitle,
	weekDayKeys,
	type HabitStreaks,
} from '@/features/habits/habitUtils';
import { canUseTodo } from '@/features/todo/todoAccess';
import { TODO_COLORS } from '@/features/todo/todoMarkdown';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function dayDone(list: TodoListDetail, dayKey: string): boolean {
	return (list.items ?? []).some((item) => {
		if (!item.due_at) return false;
		const key = item.due_at.slice(0, 10);
		return key === dayKey && item.done;
	});
}

function dayItemId(list: TodoListDetail, dayKey: string): number | null {
	const item = (list.items ?? []).find((row) => row.due_at?.slice(0, 10) === dayKey);
	return item?.id ?? null;
}

export default function HabitsApp() {
	useWindowTitle('Привычки');
	const queryClient = useQueryClient();
	const [newName, setNewName] = useState('');
	const days = useMemo(() => weekDayKeys(new Date()), []);
	const todayKey = formatDayKey(new Date());

	const listsQuery = useQuery({
		queryKey: queryKeys.todo.lists,
		queryFn: () => todoApi.lists(),
		enabled: canUseTodo(),
	});

	const habitSummaries = useMemo(
		() => (listsQuery.data ?? []).filter((list) => isHabitListTitle(list.title)),
		[listsQuery.data],
	);

	const detailsQuery = useQuery({
		queryKey: ['habits', 'details', habitSummaries.map((h) => h.id).join(',')],
		queryFn: async () => {
			const details = await Promise.all(habitSummaries.map((h) => todoApi.detail(h.id)));
			return details;
		},
		enabled: canUseTodo() && habitSummaries.length > 0,
	});

	const streaksQuery = useQuery({
		queryKey: ['habits', 'streaks'],
		queryFn: async () => {
			const row = await userDataApi.getOptional(HABITS_STREAK_CODE);
			return (row?.value as HabitStreaks) ?? {};
		},
		enabled: canUseTodo(),
	});

	const createMutation = useMutation({
		mutationFn: (name: string) =>
			todoApi.create({
				title: toHabitListTitle(name),
				color: TODO_COLORS[Math.floor(Math.random() * TODO_COLORS.length)],
				items: [],
			}),
		onSuccess: () => {
			setNewName('');
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать привычку' });
		},
	});

	const toggleMutation = useMutation({
		mutationFn: async ({
			list,
			dayKey,
			done,
		}: {
			list: TodoListDetail;
			dayKey: string;
			done: boolean;
		}) => {
			const existingId = dayItemId(list, dayKey);
			const items = [...(list.items ?? [])];
			if (existingId) {
				const next = items.map((item) =>
					item.id === existingId
						? { ...item, done, due_at: `${dayKey}T12:00:00` }
						: item,
				);
				return todoApi.update(list.id, {
					title: list.title,
					color: list.color,
					notes_md: list.notes_md,
					items: next.map((item) => ({
						id: item.id,
						text: item.text,
						done: item.done,
						due_at: item.due_at ?? null,
						calendar_event_id: item.calendar_event_id ?? null,
						board_card_id: item.board_card_id ?? null,
						position: item.position,
					})),
				});
			}
			items.push({
				text: dayKey,
				done,
				due_at: `${dayKey}T12:00:00`,
			});
			return todoApi.update(list.id, {
				title: list.title,
				color: list.color,
				notes_md: list.notes_md,
				items: items.map((item) => ({
					id: item.id,
					text: item.text,
					done: item.done,
					due_at: item.due_at ?? null,
					calendar_event_id: item.calendar_event_id ?? null,
					board_card_id: item.board_card_id ?? null,
					position: item.position,
				})),
			});
		},
		onSuccess: async (updated) => {
			void queryClient.invalidateQueries({ queryKey: ['habits', 'details'] });
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });

			const doneDates = (updated.items ?? [])
				.filter((item) => item.done && item.due_at)
				.map((item) => item.due_at!.slice(0, 10));
			const count = computeStreak(doneDates, todayKey);
			const prev = streaksQuery.data ?? {};
			const next: HabitStreaks = {
				...prev,
				[String(updated.id)]: { count, lastDate: todayKey },
			};
			await userDataApi.upsert({ code: HABITS_STREAK_CODE, value: next });
			void queryClient.invalidateQueries({ queryKey: ['habits', 'streaks'] });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось обновить день' });
		},
	});

	if (!canUseTodo()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Войдите в систему, чтобы пользоваться привычками
			</Alert>
		);
	}

	const details = detailsQuery.data ?? [];

	return (
		<Stack gap="md" p="md" style={{ minHeight: 0, overflow: 'auto' }}>
			<Group justify="space-between" align="flex-end">
				<Text fw={600}>Привычки</Text>
				<Group align="flex-end">
					<TextInput
						label="Новая привычка"
						placeholder="Зарядка"
						value={newName}
						onChange={(e) => setNewName(e.currentTarget.value)}
						w={220}
					/>
					<Button
						leftSection={<IconPlus size={14} />}
						loading={createMutation.isPending}
						onClick={() => createMutation.mutate(newName || 'Новая привычка')}
					>
						Добавить
					</Button>
				</Group>
			</Group>

			{listsQuery.isLoading || (habitSummaries.length > 0 && detailsQuery.isLoading) ? (
				<Loader size="sm" />
			) : habitSummaries.length === 0 ? (
				<Text c="dimmed">Пока нет привычек. Добавьте первую — список Todo с префиксом «Habit:».</Text>
			) : (
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Привычка</Table.Th>
							{WEEKDAY_LABELS.map((label) => (
								<Table.Th key={label} style={{ textAlign: 'center', width: 48 }}>
									{label}
								</Table.Th>
							))}
							<Table.Th style={{ width: 80 }}>Streak</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{details.map((list) => {
							const streak =
								streaksQuery.data?.[String(list.id)]?.count ??
								computeStreak(
									(list.items ?? [])
										.filter((i) => i.done && i.due_at)
										.map((i) => i.due_at!.slice(0, 10)),
									todayKey,
								);
							return (
								<Table.Tr key={list.id}>
									<Table.Td>
										<Text size="sm" fw={500}>
											{habitDisplayName(list.title)}
										</Text>
									</Table.Td>
									{days.map((dayKey) => (
										<Table.Td key={dayKey} style={{ textAlign: 'center' }}>
											<Checkbox
												checked={dayDone(list, dayKey)}
												disabled={!list.can_write || toggleMutation.isPending}
												onChange={(e) =>
													toggleMutation.mutate({
														list,
														dayKey,
														done: e.currentTarget.checked,
													})
												}
												aria-label={`${habitDisplayName(list.title)} ${dayKey}`}
											/>
										</Table.Td>
									))}
									<Table.Td>
										<Text size="sm" c={streak > 0 ? 'teal' : 'dimmed'}>
											{streak}
										</Text>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
