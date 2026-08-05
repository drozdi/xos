import {
	ActionIcon,
	Box,
	Button,
	Checkbox,
	ColorInput,
	Group,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { IconPlus, IconShare, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import type { CalendarDto } from '@/core/api/endpoints/calendarApi';
import { BATTLE_NET } from '@/core/theme/battleNetTheme';

import {
	OVERLAY_SCHOOLTASK_ID,
	OVERLAY_TODO_ID,
	ownCalendarVisibilityId,
	useCalendarVisibilityStore,
} from '../visibilityStore';

interface CalendarSidebarProps {
	calendars: CalendarDto[];
	showSchooltaskOverlay: boolean;
	onCreateCalendar: (title: string, color: string) => void;
	onShare: (calendar: CalendarDto) => void;
	onDelete: (calendar: CalendarDto) => void;
	creating?: boolean;
	deletingId?: number | null;
}

function ColorSwatch({ color }: { color: string }) {
	return (
		<Box
			w={12}
			h={12}
			style={{
				borderRadius: 2,
				background: color,
				flexShrink: 0,
				border: '1px solid var(--mantine-color-default-border)',
			}}
		/>
	);
}

function CalendarRow({
	id,
	title,
	color,
	meta,
	shareButton,
}: {
	id: string;
	title: string;
	color: string;
	meta?: string;
	shareButton?: React.ReactNode;
}) {
	const isVisible = useCalendarVisibilityStore((s) => s.isVisible(id));
	const setVisible = useCalendarVisibilityStore((s) => s.setVisible);

	return (
		<Group gap="xs" wrap="nowrap" justify="space-between">
			<Checkbox
				size="xs"
				checked={isVisible}
				onChange={(e) => setVisible(id, e.currentTarget.checked)}
				label={
					<Group gap={6} wrap="nowrap">
						<ColorSwatch color={color} />
						<Text size="sm" lineClamp={1}>
							{title}
						</Text>
					</Group>
				}
				styles={{ body: { alignItems: 'center' }, label: { paddingLeft: 6 } }}
			/>
			<Group gap={4} wrap="nowrap">
				{meta ? (
					<Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
						{meta}
					</Text>
				) : null}
				{shareButton}
			</Group>
		</Group>
	);
}

export function CalendarSidebar({
	calendars,
	showSchooltaskOverlay,
	onCreateCalendar,
	onShare,
	onDelete,
	creating,
	deletingId,
}: CalendarSidebarProps) {
	const [title, setTitle] = useState('');
	const [color, setColor] = useState(BATTLE_NET.accent);
	const [showForm, setShowForm] = useState(false);

	const owned = calendars.filter((c) => c.is_owner);
	const shared = calendars.filter((c) => !c.is_owner);

	const handleCreate = () => {
		const trimmed = title.trim();
		if (!trimmed) {
			return;
		}
		onCreateCalendar(trimmed, color);
		setTitle('');
		setShowForm(false);
	};

	return (
		<Stack
			gap="md"
			p="md"
			w={260}
			style={{
				borderRight: '1px solid var(--mantine-color-default-border)',
				overflow: 'auto',
				flexShrink: 0,
				height: '100%',
			}}
		>
			<div>
				<Group justify="space-between" mb="xs">
					<Text fw={600} size="sm">
						Мои календари
					</Text>
					<Tooltip label="Создать календарь">
						<ActionIcon
							variant="subtle"
							size="sm"
							aria-label="Создать календарь"
							onClick={() => setShowForm((v) => !v)}
						>
							<IconPlus size={14} />
						</ActionIcon>
					</Tooltip>
				</Group>
				<Stack gap={6}>
					{owned.map((cal) => (
						<CalendarRow
							key={cal.id}
							id={ownCalendarVisibilityId(cal.id)}
							title={cal.title}
							color={cal.color}
							shareButton={
								<>
									<Tooltip label="Поделиться">
										<ActionIcon
											variant="subtle"
											size="sm"
											aria-label="Поделиться"
											onClick={() => onShare(cal)}
										>
											<IconShare size={14} />
										</ActionIcon>
									</Tooltip>
									{cal.can_delete ? (
										<Tooltip label="Удалить">
											<ActionIcon
												variant="subtle"
												size="sm"
												color="red"
												aria-label="Удалить"
												loading={deletingId === cal.id}
												onClick={() => onDelete(cal)}
											>
												<IconTrash size={14} />
											</ActionIcon>
										</Tooltip>
									) : null}
								</>
							}
						/>
					))}
				</Stack>
				{showForm ? (
					<Stack gap="xs" mt="sm">
						<TextInput
							size="xs"
							placeholder="Название"
							value={title}
							onChange={(e) => setTitle(e.currentTarget.value)}
						/>
						<ColorInput size="xs" value={color} onChange={setColor} format="hex" />
						<Button size="xs" loading={creating} onClick={handleCreate}>
							Создать
						</Button>
					</Stack>
				) : null}
			</div>

			{shared.length > 0 ? (
				<div>
					<Text fw={600} size="sm" mb="xs">
						Другие календари
					</Text>
					<Stack gap={6}>
						{shared.map((cal) => (
							<CalendarRow
								key={cal.id}
								id={ownCalendarVisibilityId(cal.id)}
								title={cal.title}
								color={cal.color}
								meta={
									cal.via_group
										? cal.can_write
											? 'группа · ред.'
											: 'группа'
										: cal.can_write
											? undefined
											: 'просмотр'
								}
							/>
						))}
					</Stack>
				</div>
			) : null}

			<div>
				<Text fw={600} size="sm" mb="xs">
					Системные
				</Text>
				<Stack gap={6}>
					<CalendarRow id={OVERLAY_TODO_ID} title="Заметки" color="#78909c" />
					{showSchooltaskOverlay ? (
						<CalendarRow id={OVERLAY_SCHOOLTASK_ID} title="Моё расписание" color={BATTLE_NET.accent} />
					) : null}
				</Stack>
			</div>
		</Stack>
	);
}
