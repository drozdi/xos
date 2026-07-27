import { useMemo, useState } from 'react';
import { useTableColumnMetaContext } from '../../context';
import type { ColumnEntity } from '../../type';
import {
	COLUMN_DND_MIME,
	parseColumnDndPayload,
	serializeColumnDndPayload,
} from '../../utils/column-dnd';
import {
	getColumnSegmentKey,
	isColumnGroupHeader,
	isColumnOrderReorderable,
	isColumnReorderTarget,
	isNestedColumn,
	resolveColumnGroupKey,
} from '../../utils/column-fields';

export function useColumnDrag<T = object>(
	column: ColumnEntity<T>,
	color: string = 'gray',
): {
	bg?: string;
	draggable: boolean;
	onDragStart?: (e: React.DragEvent) => void;
	onDragEnd?: (e: React.DragEvent) => void;
	onDragOver?: (e: React.DragEvent) => void;
	onDragLeave?: (e: React.DragEvent) => void;
	onDrop?: (e: React.DragEvent) => void;
} {
	const [hovered, setHovered] = useState(false);
	const { sortColumn, sortColumnSegment } = useTableColumnMetaContext<T>();
	const parentKey = resolveColumnGroupKey(column);

	const isFieldDrag = !!column.isDraggable && isColumnOrderReorderable(column);
	const isSegmentDrag =
		!!column.isDraggable && isColumnGroupHeader(column) && !isNestedColumn(column);
	const enabled = !!column.isDraggable && isColumnReorderTarget(column);
	const dropSegmentKey = getColumnSegmentKey(column);

	return useMemo(() => {
		if (!enabled) {
			return { draggable: false as const };
		}

		return {
			bg: hovered ? color : undefined,
			draggable: true as const,
			onDragStart: (e: React.DragEvent) => {
				if (isSegmentDrag) {
					e.dataTransfer.setData(
						COLUMN_DND_MIME,
						serializeColumnDndPayload({
							kind: 'segment',
							segmentKey: dropSegmentKey,
							parentKey,
						}),
					);
				} else {
					e.dataTransfer.setData(
						COLUMN_DND_MIME,
						serializeColumnDndPayload({
							kind: 'field',
							field: String(column.field),
							parentKey,
						}),
					);
				}
				e.dataTransfer.effectAllowed = 'move';
			},
			onDragEnd: () => {
				setHovered(false);
			},
			onDragOver: (e: React.DragEvent) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';
				setHovered(true);
			},
			onDragLeave: () => {
				setHovered(false);
			},
			onDrop: (e: React.DragEvent) => {
				e.preventDefault();
				const payload = parseColumnDndPayload(e.dataTransfer.getData(COLUMN_DND_MIME));
				if (!payload || payload.parentKey !== parentKey) {
					setHovered(false);
					return;
				}

				if (payload.kind === 'field' && isFieldDrag) {
					if (payload.field === String(column.field)) {
						setHovered(false);
						return;
					}
					sortColumn(payload.field as keyof T, column.field as keyof T);
				} else if (payload.kind === 'segment' && (isSegmentDrag || isFieldDrag)) {
					if (payload.segmentKey === dropSegmentKey) {
						setHovered(false);
						return;
					}
					sortColumnSegment(payload.segmentKey, dropSegmentKey, parentKey);
				} else if (payload.kind === 'field' && isSegmentDrag) {
					sortColumnSegment(payload.field, dropSegmentKey, parentKey);
				}

				setHovered(false);
			},
		};
	}, [
		column,
		dropSegmentKey,
		enabled,
		hovered,
		isFieldDrag,
		isSegmentDrag,
		parentKey,
		sortColumn,
		sortColumnSegment,
	]);
}
