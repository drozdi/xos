import {
	ActionIcon,
	Avatar,
	Button,
	Checkbox,
	Divider,
	FileButton,
	Grid,
	Group,
	Loader,
	Modal,
	MultiSelect,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
	type BoardLabel,
	type BoardMember,
	boardApi,
} from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAuthStore } from '@/core/auth/authStore';
import { confirmAction } from '@/core/confirm/confirmAction';

interface CardModalProps {
	cardId: number | null;
	boardId: number;
	labels: BoardLabel[];
	members: BoardMember[];
	canEdit: boolean;
	onClose: () => void;
}

function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

function userRefLabel(user: { id?: number | null; alias?: string | null; email?: string | null }): string {
	return user.alias?.trim() || user.email?.trim() || (user.id != null ? `User #${user.id}` : 'User');
}

function memberInitials(member: BoardMember): string {
	const label = memberLabel(member);
	const parts = label.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		const a = parts[0]?.[0] ?? '';
		const b = parts[1]?.[0] ?? '';
		return (a + b).toUpperCase() || '?';
	}
	return label.slice(0, 2).toUpperCase() || '?';
}

export function CardModal({
	cardId,
	boardId,
	labels,
	members,
	canEdit,
	onClose,
}: CardModalProps) {
	const queryClient = useQueryClient();
	const currentUserId = useAuthStore((s) => s.user?.id ?? null);
	const opened = cardId != null;

	const cardQuery = useQuery({
		queryKey: queryKeys.board.card(cardId ?? 0),
		queryFn: () => boardApi.card(cardId!),
		enabled: opened,
	});

	const invalidateBoard = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
		if (cardId != null) {
			await queryClient.invalidateQueries({ queryKey: queryKeys.board.card(cardId) });
		}
	};

	const handleClose = async () => {
		await invalidateBoard();
		onClose();
	};

	const card = cardQuery.data;

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [newComment, setNewComment] = useState('');
	const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
	const [editingCommentText, setEditingCommentText] = useState('');
	const [newChecklistTitle, setNewChecklistTitle] = useState('');
	const [newItemText, setNewItemText] = useState<Record<number, string>>({});

	const [debouncedTitle] = useDebouncedValue(title, 500);
	const [debouncedDescription] = useDebouncedValue(description, 500);

	useEffect(() => {
		if (!card) {
			return;
		}
		setTitle(card.title);
		setDescription(card.description_md ?? '');
		setDueDate(card.due_date && dayjs(card.due_date).isValid() ? dayjs(card.due_date).format('YYYY-MM-DD') : null);
		setShowPreview(false);
		setNewComment('');
		setEditingCommentId(null);
	}, [card?.id, card?.title, card?.description_md, card?.due_date]);

	const updateCardMutation = useMutation({
		mutationFn: (payload: Parameters<typeof boardApi.updateCard>[1]) =>
			boardApi.updateCard(cardId!, payload),
		onSuccess: () => invalidateBoard(),
	});

	useEffect(() => {
		if (!card || !canEdit || cardId == null) {
			return;
		}
		const trimmed = debouncedTitle.trim();
		if (trimmed && trimmed !== card.title) {
			updateCardMutation.mutate({ title: trimmed });
		}
	}, [debouncedTitle]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!card || !canEdit || cardId == null) {
			return;
		}
		const next = debouncedDescription.trim() || null;
		const current = card.description_md?.trim() || null;
		if (next !== current) {
			updateCardMutation.mutate({ description_md: next });
		}
	}, [debouncedDescription]); // eslint-disable-line react-hooks/exhaustive-deps

	const memberOptions = useMemo(
		() =>
			members
				.filter((m) => m.user_id != null)
				.map((m) => ({ value: String(m.user_id), label: memberLabel(m) })),
		[members],
	);

	const labelOptions = useMemo(
		() =>
			labels.map((l) => ({
				value: String(l.id),
				label: l.name,
			})),
		[labels],
	);

	const assigneeMutation = useMutation({
		mutationFn: (userIds: number[]) => boardApi.setCardAssignees(cardId!, userIds),
		onSuccess: () => invalidateBoard(),
	});

	const labelMutation = useMutation({
		mutationFn: (labelIds: number[]) => boardApi.setCardLabels(cardId!, labelIds),
		onSuccess: () => invalidateBoard(),
	});

	const createChecklistMutation = useMutation({
		mutationFn: (checklistTitle: string) =>
			boardApi.createChecklist(cardId!, { title: checklistTitle }),
		onSuccess: () => {
			setNewChecklistTitle('');
			invalidateBoard();
		},
	});

	const deleteChecklistMutation = useMutation({
		mutationFn: (id: number) => boardApi.deleteChecklist(id),
		onSuccess: () => invalidateBoard(),
	});

	const createItemMutation = useMutation({
		mutationFn: ({ checklistId, text }: { checklistId: number; text: string }) =>
			boardApi.createChecklistItem(checklistId, { text }),
		onSuccess: (_data, vars) => {
			setNewItemText((prev) => ({ ...prev, [vars.checklistId]: '' }));
			invalidateBoard();
		},
	});

	const updateItemMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: number;
			payload: { text?: string; checked?: boolean };
		}) => boardApi.updateChecklistItem(id, payload),
		onSuccess: () => invalidateBoard(),
	});

	const deleteItemMutation = useMutation({
		mutationFn: (id: number) => boardApi.deleteChecklistItem(id),
		onSuccess: () => invalidateBoard(),
	});

	const createCommentMutation = useMutation({
		mutationFn: (text: string) => boardApi.createComment(cardId!, { text }),
		onSuccess: () => {
			setNewComment('');
			invalidateBoard();
		},
	});

	const updateCommentMutation = useMutation({
		mutationFn: ({ id, text }: { id: number; text: string }) =>
			boardApi.updateComment(id, { text }),
		onSuccess: () => {
			setEditingCommentId(null);
			invalidateBoard();
		},
	});

	const deleteCommentMutation = useMutation({
		mutationFn: (id: number) => boardApi.deleteComment(id),
		onSuccess: () => invalidateBoard(),
	});

	const uploadAttachmentMutation = useMutation({
		mutationFn: (file: File) => boardApi.uploadAttachment(cardId!, file),
		onSuccess: () => invalidateBoard(),
	});

	const deleteAttachmentMutation = useMutation({
		mutationFn: (id: number) => boardApi.deleteAttachment(id),
		onSuccess: () => invalidateBoard(),
	});

	const handleDueDateChange = (value: string | null) => {
		setDueDate(value);
		if (!canEdit || cardId == null) {
			return;
		}
		const apiValue = value ? `${value}T00:00:00` : null;
		updateCardMutation.mutate({ due_date: apiValue });
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title="Карточка"
			size="xl"
			centered
		>
			{cardQuery.isLoading ? (
				<Group justify="center" py="xl">
					<Loader size="sm" />
				</Group>
			) : cardQuery.isError || !card ? (
				<Text c="red" size="sm">
					Не удалось загрузить карточку
				</Text>
			) : (
				<Grid gap="md">
					<Grid.Col span={{ base: 12, md: 8 }}>
						<Stack gap="md">
							<TextInput
								label="Название"
								value={title}
								onChange={(e) => setTitle(e.currentTarget.value)}
								onBlur={() => {
									if (!canEdit) {
										return;
									}
									const trimmed = title.trim();
									if (trimmed && trimmed !== card.title) {
										updateCardMutation.mutate({ title: trimmed });
									}
								}}
								readOnly={!canEdit}
							/>

							<Stack gap="xs">
								<Group justify="space-between">
									<Text size="sm" fw={500}>
										Описание
									</Text>
									{description.trim() ? (
										<Button
											variant="subtle"
											size="compact-xs"
											onClick={() => setShowPreview((v) => !v)}
										>
											{showPreview ? 'Редактировать' : 'Превью'}
										</Button>
									) : null}
								</Group>
								{showPreview ? (
									<Stack
										gap="xs"
										p="sm"
										style={{
											border: '1px solid var(--mantine-color-default-border)',
											borderRadius: 8,
											minHeight: 80,
										}}
									>
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{description || '_Пусто_'}
										</ReactMarkdown>
									</Stack>
								) : (
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.currentTarget.value)}
										minRows={4}
										placeholder="Markdown-описание"
										readOnly={!canEdit}
									/>
								)}
							</Stack>

							<DatePickerInput
								label="Срок"
								value={dueDate}
								onChange={handleDueDateChange}
								valueFormat="DD.MM.YYYY"
								clearable
								readOnly={!canEdit}
							/>

							<Divider label="Чеклисты" labelPosition="left" />

							{card.checklists.map((checklist) => {
								const checkedCount = checklist.items.filter((i) => i.checked).length;
								return (
									<Stack key={checklist.id} gap="xs">
										<Group justify="space-between">
											<Text size="sm" fw={600}>
												{checklist.title}
												{checklist.items.length > 0 ? (
													<Text span size="xs" c="dimmed" ml={6}>
														{checkedCount}/{checklist.items.length}
													</Text>
												) : null}
											</Text>
											{canEdit ? (
												<Tooltip label="Удалить чеклист">
													<ActionIcon
														variant="subtle"
														color="red"
														size="sm"
														onClick={() =>
															confirmAction({
																title: 'Удалить чеклист',
																message: 'Удалить чеклист и все пункты?',
																confirmColor: 'red',
																onConfirm: () =>
																	deleteChecklistMutation.mutate(checklist.id),
															})
														}
													>
														<IconTrash size={14} />
													</ActionIcon>
												</Tooltip>
											) : null}
										</Group>
										<Stack gap={4}>
											{checklist.items.map((item) => (
												<Group key={item.id} gap="xs" wrap="nowrap">
													<Checkbox
														checked={item.checked}
														onChange={(e) => {
															if (!canEdit) {
																return;
															}
															updateItemMutation.mutate({
																id: item.id,
																payload: { checked: e.currentTarget.checked },
															});
														}}
														disabled={!canEdit}
													/>
													<Text
														size="sm"
														style={{
															flex: 1,
															textDecoration: item.checked ? 'line-through' : undefined,
															opacity: item.checked ? 0.6 : 1,
														}}
													>
														{item.text}
													</Text>
													{canEdit ? (
														<ActionIcon
															variant="subtle"
															color="red"
															size="sm"
															onClick={() =>
																deleteItemMutation.mutate(item.id)
															}
														>
															<IconTrash size={12} />
														</ActionIcon>
													) : null}
												</Group>
											))}
										</Stack>
										{canEdit ? (
											<Group gap="xs">
												<TextInput
													size="xs"
													placeholder="Новый пункт"
													style={{ flex: 1 }}
													value={newItemText[checklist.id] ?? ''}
													onChange={(e) =>
														setNewItemText((prev) => ({
															...prev,
															[checklist.id]: e.currentTarget.value,
														}))
													}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															const text = (newItemText[checklist.id] ?? '').trim();
															if (text) {
																createItemMutation.mutate({
																	checklistId: checklist.id,
																	text,
																});
															}
														}
													}}
												/>
												<ActionIcon
													variant="light"
													onClick={() => {
														const text = (newItemText[checklist.id] ?? '').trim();
														if (text) {
															createItemMutation.mutate({
																checklistId: checklist.id,
																text,
															});
														}
													}}
												>
													<IconPlus size={14} />
												</ActionIcon>
											</Group>
										) : null}
									</Stack>
								);
							})}

							{canEdit ? (
								<Group gap="xs">
									<TextInput
										size="xs"
										placeholder="Название чеклиста"
										style={{ flex: 1 }}
										value={newChecklistTitle}
										onChange={(e) => setNewChecklistTitle(e.currentTarget.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												const t = newChecklistTitle.trim();
												if (t) {
													createChecklistMutation.mutate(t);
												}
											}
										}}
									/>
									<Button
										size="xs"
										variant="light"
										leftSection={<IconPlus size={14} />}
										loading={createChecklistMutation.isPending}
										onClick={() => {
											const t = newChecklistTitle.trim();
											if (t) {
												createChecklistMutation.mutate(t);
											}
										}}
									>
										Чеклист
									</Button>
								</Group>
							) : null}

							<Divider label="Комментарии" labelPosition="left" />

							<Stack gap="sm">
								{card.comments.map((comment) => {
									const isOwn = currentUserId != null && comment.user.id === currentUserId;
									const isEditing = editingCommentId === comment.id;
									return (
										<Stack key={comment.id} gap={4}>
											<Group gap="xs">
												<Text size="sm" fw={500}>
													{userRefLabel(comment.user)}
												</Text>
												{comment.created_at ? (
													<Text size="xs" c="dimmed">
														{dayjs(comment.created_at).format('DD.MM.YYYY HH:mm')}
													</Text>
												) : null}
											</Group>
											{isEditing ? (
												<Stack gap="xs">
													<Textarea
														value={editingCommentText}
														onChange={(e) =>
															setEditingCommentText(e.currentTarget.value)
														}
														minRows={2}
														autosize
													/>
													<Group gap="xs">
														<Button
															size="compact-xs"
															onClick={() =>
																updateCommentMutation.mutate({
																	id: comment.id,
																	text: editingCommentText.trim(),
																})
															}
														>
															Сохранить
														</Button>
														<Button
															size="compact-xs"
															variant="default"
															onClick={() => setEditingCommentId(null)}
														>
															Отмена
														</Button>
													</Group>
												</Stack>
											) : (
												<Group justify="space-between" align="flex-start" wrap="nowrap">
													<Text size="sm" style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
														{comment.text}
													</Text>
													{isOwn && canEdit ? (
														<Group gap={4} wrap="nowrap">
															<Button
																size="compact-xs"
																variant="subtle"
																onClick={() => {
																	setEditingCommentId(comment.id);
																	setEditingCommentText(comment.text);
																}}
															>
																Изм.
															</Button>
															<Button
																size="compact-xs"
																variant="subtle"
																color="red"
																onClick={() =>
																	confirmAction({
																		title: 'Удалить комментарий',
																		message: 'Удалить комментарий?',
																		confirmColor: 'red',
																		onConfirm: () =>
																			deleteCommentMutation.mutate(comment.id),
																	})
																}
															>
																Удал.
															</Button>
														</Group>
													) : null}
												</Group>
											)}
										</Stack>
									);
								})}
							</Stack>

							{canEdit ? (
								<Stack gap="xs">
									<Textarea
										placeholder="Написать комментарий…"
										value={newComment}
										onChange={(e) => setNewComment(e.currentTarget.value)}
										minRows={2}
									/>
									<Group justify="flex-end">
										<Button
											size="xs"
											loading={createCommentMutation.isPending}
											disabled={!newComment.trim()}
											onClick={() => createCommentMutation.mutate(newComment.trim())}
										>
											Отправить
										</Button>
									</Group>
								</Stack>
							) : null}

							<Divider label="Вложения" labelPosition="left" />

							<Stack gap="xs">
								{card.attachments.map((attachment) => (
									<Group key={attachment.id} justify="space-between" wrap="nowrap">
										<Text size="sm" truncate style={{ flex: 1 }}>
											{attachment.file_name}
										</Text>
										{canEdit ? (
											<ActionIcon
												variant="subtle"
												color="red"
												size="sm"
												onClick={() =>
													confirmAction({
														title: 'Удалить вложение',
														message: `Удалить «${attachment.file_name}»?`,
														confirmColor: 'red',
														onConfirm: () =>
															deleteAttachmentMutation.mutate(attachment.id),
													})
												}
											>
												<IconTrash size={14} />
											</ActionIcon>
										) : null}
									</Group>
								))}
								{canEdit ? (
									<FileButton
										onChange={(file) => {
											if (file) {
												uploadAttachmentMutation.mutate(file);
											}
										}}
									>
										{(props) => (
											<Button
												{...props}
												size="xs"
												variant="light"
												loading={uploadAttachmentMutation.isPending}
											>
												Загрузить файл
											</Button>
										)}
									</FileButton>
								) : null}
							</Stack>
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 4 }}>
						<Stack gap="md">
							<MultiSelect
								label="Исполнители"
								data={memberOptions}
								value={card.assignee_ids.map(String)}
								onChange={(values) => {
									if (!canEdit) {
										return;
									}
									assigneeMutation.mutate(values.map(Number));
								}}
								searchable
								clearable
								readOnly={!canEdit}
							/>

							<MultiSelect
								label="Метки"
								data={labelOptions}
								value={card.label_ids.map(String)}
								onChange={(values) => {
									if (!canEdit) {
										return;
									}
									labelMutation.mutate(values.map(Number));
								}}
								searchable
								clearable
								readOnly={!canEdit}
								renderOption={({ option }) => {
									const label = labels.find((l) => String(l.id) === option.value);
									return (
										<Group gap="xs">
											{label ? (
												<span
													style={{
														width: 12,
														height: 12,
														borderRadius: 4,
														backgroundColor: label.color,
														flexShrink: 0,
													}}
												/>
											) : null}
											<span>{option.label}</span>
										</Group>
									);
								}}
							/>

							{card.assignee_ids.length > 0 ? (
								<Stack gap="xs">
									<Text size="sm" fw={500}>
										Назначены
									</Text>
									<Group gap="xs">
										{card.assignee_ids.map((userId) => {
											const member = members.find((m) => m.user_id === userId);
											return (
												<Tooltip
													key={userId}
													label={member ? memberLabel(member) : `User #${userId}`}
												>
													<Avatar size="sm" radius="xl" color="blue">
														{member ? memberInitials(member) : `#${userId}`}
													</Avatar>
												</Tooltip>
											);
										})}
									</Group>
								</Stack>
							) : null}
						</Stack>
					</Grid.Col>
				</Grid>
			)}
		</Modal>
	);
}
