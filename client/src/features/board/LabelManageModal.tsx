import {
	ActionIcon,
	Box,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { boardApi, type BoardLabel } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';

import { BOARD_BACKGROUND_COLORS } from './BackgroundPicker';

interface LabelManageModalProps {
	boardId: number;
	labels: BoardLabel[];
	opened: boolean;
	canEdit: boolean;
	onClose: () => void;
}

function ColorSwatches({
	value,
	onChange,
	disabled,
}: {
	value: string;
	onChange: (color: string) => void;
	disabled?: boolean;
}) {
	return (
		<Group gap={6}>
			{BOARD_BACKGROUND_COLORS.map((color) => (
				<UnstyledButton
					key={color}
					disabled={disabled}
					onClick={() => onChange(color)}
					style={{
						width: 24,
						height: 24,
						borderRadius: 4,
						backgroundColor: color,
						border:
							value === color
								? '2px solid var(--mantine-color-text)'
								: '1px solid var(--mantine-color-default-border)',
						opacity: disabled ? 0.5 : 1,
					}}
					aria-label={`Цвет ${color}`}
				/>
			))}
		</Group>
	);
}

export function LabelManageModal({
	boardId,
	labels,
	opened,
	canEdit,
	onClose,
}: LabelManageModalProps) {
	const queryClient = useQueryClient();
	const [newName, setNewName] = useState('');
	const [newColor, setNewColor] = useState<string>(BOARD_BACKGROUND_COLORS[0]);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState('');
	const [editColor, setEditColor] = useState('');

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
	};

	const createMutation = useMutation({
		mutationFn: () => boardApi.createLabel(boardId, { name: newName.trim(), color: newColor }),
		onSuccess: async () => {
			setNewName('');
			setNewColor(BOARD_BACKGROUND_COLORS[0]);
			await invalidate();
			notifications.show({ color: 'green', message: 'Метка создана' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать метку' });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
			boardApi.updateLabel(id, { name, color }),
		onSuccess: async () => {
			setEditingId(null);
			await invalidate();
			notifications.show({ color: 'green', message: 'Метка обновлена' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось обновить метку' });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => boardApi.deleteLabel(id),
		onSuccess: async () => {
			await invalidate();
			notifications.show({ color: 'green', message: 'Метка удалена' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить метку' });
		},
	});

	const startEdit = (label: BoardLabel) => {
		setEditingId(label.id);
		setEditName(label.name);
		setEditColor(label.color);
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Метки доски" centered size="md">
			<Stack gap="sm">
				{canEdit ? (
					<>
						<Text size="sm" c="dimmed">
							Создайте метки для карточек. Их можно назначать в карточке и фильтровать на доске.
						</Text>
						<TextInput
							label="Название"
							placeholder="Bug, Feature…"
							value={newName}
							onChange={(e) => setNewName(e.currentTarget.value)}
						/>
						<div>
							<Text size="sm" fw={500} mb={6}>
								Цвет
							</Text>
							<ColorSwatches value={newColor} onChange={setNewColor} />
						</div>
						<Button
							onClick={() => createMutation.mutate()}
							loading={createMutation.isPending}
							disabled={!newName.trim()}
						>
							Добавить метку
						</Button>
					</>
				) : (
					<Text size="sm" c="dimmed">
						Список меток доски.
					</Text>
				)}

				{labels.length === 0 ? (
					<Text size="sm" c="dimmed">
						Пока нет меток
					</Text>
				) : (
					<Stack gap={8}>
						<Text fw={600} size="sm">
							Метки ({labels.length})
						</Text>
						{labels.map((label) =>
							editingId === label.id && canEdit ? (
								<Stack key={label.id} gap={6} p="xs" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
									<TextInput
										size="xs"
										value={editName}
										onChange={(e) => setEditName(e.currentTarget.value)}
									/>
									<ColorSwatches value={editColor} onChange={setEditColor} />
									<Group gap="xs">
										<Button
											size="xs"
											loading={updateMutation.isPending}
											disabled={!editName.trim()}
											onClick={() =>
												updateMutation.mutate({
													id: label.id,
													name: editName.trim(),
													color: editColor,
												})
											}
										>
											Сохранить
										</Button>
										<Button size="xs" variant="subtle" onClick={() => setEditingId(null)}>
											Отмена
										</Button>
									</Group>
								</Stack>
							) : (
								<Group key={label.id} justify="space-between" wrap="nowrap">
									<Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
										<Box
											w={14}
											h={14}
											style={{
												borderRadius: 4,
												backgroundColor: label.color,
												flexShrink: 0,
											}}
										/>
										<Text size="sm" truncate>
											{label.name}
										</Text>
									</Group>
									{canEdit ? (
										<Group gap={4} wrap="nowrap">
											<ActionIcon
												variant="subtle"
												size="sm"
												aria-label="Редактировать"
												onClick={() => startEdit(label)}
											>
												<IconPencil size={14} />
											</ActionIcon>
											<ActionIcon
												variant="subtle"
												color="red"
												size="sm"
												aria-label="Удалить"
												loading={deleteMutation.isPending}
												onClick={() =>
													confirmAction({
														title: 'Удалить метку',
														message: `Удалить метку «${label.name}»? Она будет снята со всех карточек.`,
														confirmColor: 'red',
														onConfirm: () => deleteMutation.mutate(label.id),
													})
												}
											>
												<IconTrash size={14} />
											</ActionIcon>
										</Group>
									) : null}
								</Group>
							),
						)}
					</Stack>
				)}
			</Stack>
		</Modal>
	);
}
