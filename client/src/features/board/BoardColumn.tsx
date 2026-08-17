import { ActionIcon, Box, Card, Group, Select, Stack, Text, Tooltip } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useEffect, useState, type CSSProperties } from 'react';

import type { ListProps, RowComponentProps } from 'react-window';

import type { BoardCard, BoardLabel, BoardList, BoardMember } from '@/core/api/endpoints/boardApi';

import { isCardDimmed } from './boardFilterUtils';
import { CardTile, CardTileOverlay } from './CardTile';
import { QuickAddCard } from './QuickAddCard';
import { dragId, listDropId } from './dnd/types';

const CARD_VIRTUAL_THRESHOLD = 50;
const CARD_ROW_HEIGHT = 96;
const CARD_LIST_MAX_HEIGHT = 560;

interface BoardColumnProps {
	list: BoardList;
	labels: BoardLabel[];
	members: BoardMember[];
	canEdit: boolean;
	matchingIds: Set<number> | null;
	onAssigneeChange: (listId: number, assigneeId: number | null) => void;
	onDeleteList: (listId: number) => void;
	onAddCard: (listId: number, title: string) => Promise<void>;
	onCardClick?: (cardId: number) => void;
}

interface VirtualCardRowProps {
	cards: BoardCard[];
	labels: BoardLabel[];
	members: BoardMember[];
	canEdit: boolean;
	matchingIds: Set<number> | null;
	onCardClick?: (cardId: number) => void;
}

function memberLabel(member: BoardMember): string {
	return member.alias?.trim() || member.email?.trim() || `User #${member.user_id}`;
}

function VirtualCardRow({
	index,
	style,
	cards,
	labels,
	members,
	canEdit,
	matchingIds,
	onCardClick,
}: RowComponentProps<VirtualCardRowProps>) {
	const card = cards[index];
	if (!card) {
		return null;
	}

	return (
		<Box style={{ ...style, paddingBottom: 8, boxSizing: 'border-box' }}>
			<CardTile
				card={card}
				labels={labels}
				members={members}
				disabled={!canEdit}
				dimmed={isCardDimmed(card.id, matchingIds)}
				onClick={onCardClick}
			/>
		</Box>
	);
}

function CardListBody({
	cards,
	labels,
	members,
	canEdit,
	matchingIds,
	onCardClick,
}: VirtualCardRowProps) {
	const [ListComponent, setListComponent] = useState<typeof import('react-window').List | null>(null);

	useEffect(() => {
		let cancelled = false;
		void import('react-window').then((mod) => {
			if (!cancelled) {
				setListComponent(() => mod.List);
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (cards.length <= CARD_VIRTUAL_THRESHOLD || !ListComponent) {
		return (
			<Stack gap="xs" p={4}>
				{cards.map((card) => (
					<CardTile
						key={card.id}
						card={card}
						labels={labels}
						members={members}
						disabled={!canEdit}
						dimmed={isCardDimmed(card.id, matchingIds)}
						onClick={onCardClick}
					/>
				))}
			</Stack>
		);
	}

	const listHeight = Math.min(cards.length * CARD_ROW_HEIGHT, CARD_LIST_MAX_HEIGHT);
	const listStyle: CSSProperties = { height: listHeight, width: '100%' };
	const rowProps: VirtualCardRowProps = {
		cards,
		labels,
		members,
		canEdit,
		matchingIds,
		onCardClick,
	};

	const listProps = {
		rowCount: cards.length,
		rowHeight: CARD_ROW_HEIGHT,
		rowProps,
		rowComponent: VirtualCardRow,
		style: listStyle,
		overscanCount: 6,
	} satisfies Partial<ListProps<VirtualCardRowProps>>;

	return <ListComponent {...listProps} />;
}

export function BoardColumn({
	list,
	labels,
	members,
	canEdit,
	matchingIds,
	onAssigneeChange,
	onDeleteList,
	onAddCard,
	onCardClick,
}: BoardColumnProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setSortableRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: dragId('list', list.id),
		disabled: !canEdit,
	});

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: listDropId(list.id),
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const memberOptions = members
		.filter((member) => member.user_id != null)
		.map((member) => ({
			value: String(member.user_id),
			label: memberLabel(member),
		}));

	const cardIds = list.cards.map((card) => dragId('card', card.id));

	return (
		<Box ref={setSortableRef} style={style} w={288}>
			<Card
				padding="sm"
				radius="md"
				withBorder
				style={{
					backgroundColor: 'var(--mantine-color-default-hover)',
					maxHeight: 'calc(100vh - 120px)',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
					<Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
						{canEdit ? (
							<ActionIcon
								variant="subtle"
								size="sm"
								color="gray"
								style={{ cursor: 'grab' }}
								{...attributes}
								{...listeners}
							>
								<IconGripVertical size={14} />
							</ActionIcon>
						) : null}
						<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
							<Text fw={600} size="sm" lineClamp={2}>
								{list.title}
							</Text>
							{canEdit ? (
								<Select
									size="xs"
									placeholder="Исполнитель"
									clearable
									data={memberOptions}
									value={list.assignee?.id != null ? String(list.assignee.id) : null}
									onChange={(value) => onAssigneeChange(list.id, value ? Number(value) : null)}
									styles={{ input: { minHeight: 28 } }}
								/>
							) : list.assignee?.id != null ? (
								<Text size="xs" c="dimmed" lineClamp={1}>
									{list.assignee.alias || list.assignee.email || `User #${list.assignee.id}`}
								</Text>
							) : null}
						</Stack>
					</Group>
					{canEdit ? (
						<Tooltip label="Удалить список">
							<ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDeleteList(list.id)}>
								<IconTrash size={14} />
							</ActionIcon>
						</Tooltip>
					) : null}
				</Group>

				<Box
					ref={setDroppableRef}
					style={{
						flex: 1,
						minHeight: 48,
						overflowY: 'auto',
						borderRadius: 8,
						backgroundColor: isOver ? 'var(--mantine-color-blue-light)' : undefined,
						transition: 'background-color 120ms ease',
					}}
				>
					<SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
						<CardListBody
							cards={list.cards}
							labels={labels}
							members={members}
							canEdit={canEdit}
							matchingIds={matchingIds}
							onCardClick={onCardClick}
						/>
					</SortableContext>
				</Box>

				{canEdit ? (
					<Box mt="xs">
						<QuickAddCard onAdd={(title) => onAddCard(list.id, title)} />
					</Box>
				) : null}
			</Card>
		</Box>
	);
}

export function BoardColumnOverlay({ list, labels }: { list: BoardList; labels: BoardLabel[] }) {
	return (
		<Box w={288} style={{ cursor: 'grabbing' }}>
			<Card padding="sm" radius="md" withBorder shadow="md">
				<Text fw={600} size="sm" mb="xs">
					{list.title}
				</Text>
				<Stack gap="xs">
					{list.cards.slice(0, 3).map((card) => (
						<CardTileOverlay key={card.id} card={card} labels={labels} />
					))}
				</Stack>
			</Card>
		</Box>
	);
}
