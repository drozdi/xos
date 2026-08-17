import {
	DndContext,
	DragOverlay,
	closestCorners,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	type SensorDescriptor,
	type SensorOptions,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

import type { BoardLabel } from '@/core/api/endpoints/boardApi';

import { CardTileOverlay } from '../CardTile';
import { BoardColumnOverlay } from '../BoardColumn';
import type { ActiveDragItem } from './types';

interface BoardDndContextProps {
	children: ReactNode;
	sensors: SensorDescriptor<SensorOptions>[];
	activeItem: ActiveDragItem | null;
	listIds: string[];
	labels: BoardLabel[];
	onDragStart: (event: DragStartEvent) => void;
	onDragOver: (event: DragOverEvent) => void;
	onDragEnd: (event: DragEndEvent) => void;
}

export function BoardDndContext({
	children,
	sensors,
	activeItem,
	listIds,
	labels,
	onDragStart,
	onDragOver,
	onDragEnd,
}: BoardDndContextProps) {
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragEnd={onDragEnd}
		>
			<SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
				{children}
			</SortableContext>
			<DragOverlay dropAnimation={null}>
				{activeItem?.type === 'list' ? (
					<BoardColumnOverlay list={activeItem.list} labels={labels} />
				) : null}
				{activeItem?.type === 'card' ? (
					<CardTileOverlay card={activeItem.card} labels={labels} />
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
