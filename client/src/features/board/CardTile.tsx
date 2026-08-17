import { ActionIcon, Avatar, Badge, Box, Card, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { memo } from 'react';

import type { BoardCard, BoardLabel, BoardMember } from '@/core/api/endpoints/boardApi';

import { dragId } from './dnd/types';

interface CardTileProps {
	card: BoardCard;
	labels: BoardLabel[];
	members?: BoardMember[];
	disabled?: boolean;
	dimmed?: boolean;
	onClick?: (cardId: number) => void;
}

function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
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

function CardLabels({ card, labels }: { card: BoardCard; labels: BoardLabel[] }) {
	const cardLabels = labels.filter((label) => card.label_ids.includes(label.id));
	if (cardLabels.length === 0) {
		return null;
	}

	return (
		<Group gap={4} wrap="wrap">
			{cardLabels.map((label) => (
				<Badge
					key={label.id}
					size="xs"
					variant="filled"
					style={{ backgroundColor: label.color, color: '#fff' }}
				>
					{label.name}
				</Badge>
			))}
		</Group>
	);
}

function CardAssignees({ card, members }: { card: BoardCard; members: BoardMember[] }) {
	if (card.assignee_ids.length === 0 || members.length === 0) {
		return null;
	}

	return (
		<Group gap={4}>
			{card.assignee_ids.slice(0, 3).map((userId) => {
				const member = members.find((m) => m.user_id === userId);
				return (
					<Tooltip key={userId} label={member ? memberLabel(member) : `User #${userId}`}>
						<Avatar size="xs" radius="xl" color="blue">
							{member ? memberInitials(member) : `#${userId}`}
						</Avatar>
					</Tooltip>
				);
			})}
			{card.assignee_ids.length > 3 ? (
				<Text size="xs" c="dimmed">
					+{card.assignee_ids.length - 3}
				</Text>
			) : null}
		</Group>
	);
}

function CardTileContent({
	card,
	labels,
	members = [],
	dimmed = false,
	onClick,
}: CardTileProps) {
	const dueLabel =
		card.due_date && dayjs(card.due_date).isValid()
			? dayjs(card.due_date).format('DD.MM.YYYY')
			: null;

	return (
		<Card
			padding="sm"
			radius="md"
			withBorder
			shadow="xs"
			onClick={() => onClick?.(card.id)}
			style={{
				backgroundColor: 'var(--mantine-color-body)',
				cursor: onClick ? 'pointer' : undefined,
				flex: 1,
				minWidth: 0,
				opacity: dimmed ? 0.35 : 1,
				transition: 'opacity 120ms ease',
			}}
		>
			<Stack gap="xs">
				{card.cover_color ? (
					<Box
						h={6}
						style={{
							borderRadius: 4,
							backgroundColor: card.cover_color,
							marginBottom: 4,
						}}
					/>
				) : null}
				<Text size="sm" fw={500} lineClamp={4}>
					{card.title}
				</Text>
				<CardLabels card={card} labels={labels} />
				<Group justify="space-between" align="center" wrap="nowrap">
					{dueLabel ? (
						<Text size="xs" c="dimmed">
							{dueLabel}
						</Text>
					) : (
						<span />
					)}
					<CardAssignees card={card} members={members} />
				</Group>
			</Stack>
		</Card>
	);
}

export const CardTile = memo(function CardTile({
	card,
	labels,
	members = [],
	disabled,
	dimmed,
	onClick,
}: CardTileProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: dragId('card', card.id),
		disabled,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<Group ref={setNodeRef} style={style} gap={4} wrap="nowrap" align="flex-start" {...attributes}>
			{!disabled ? (
				<ActionIcon
					variant="subtle"
					size="sm"
					color="gray"
					style={{ cursor: 'grab', flexShrink: 0, marginTop: 4 }}
					{...listeners}
					onClick={(e) => e.stopPropagation()}
				>
					<IconGripVertical size={14} />
				</ActionIcon>
			) : null}
			<CardTileContent card={card} labels={labels} members={members} dimmed={dimmed} onClick={onClick} />
		</Group>
	);
});

export function CardTileOverlay({ card, labels, members = [] }: CardTileProps) {
	return (
		<Box style={{ width: 272, cursor: 'grabbing' }}>
			<CardTileContent card={card} labels={labels} members={members} />
		</Box>
	);
}
