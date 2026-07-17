import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnEntity, TableStorage } from '../type';
import {
	ROOT_COLUMN_GROUP,
	buildFieldGroupMap,
	buildSegmentOrdersMap,
	getColumnFields,
	mergeColumnOrder,
	mergeSegmentOrders,
} from '../utils/column-fields';

export function useColumnOrder<T = object>(
	columns: ColumnEntity<T>[],
	storage?: TableStorage,
	initialColumnOrder?: (keyof T)[],
	onInitialColumnOrder?: (columnOrder: (keyof T)[]) => void,
) {
	const fields = getColumnFields(columns);
	const fieldsKey = fields.join('|');
	const prevFieldsKeyRef = useRef(fieldsKey);
	const fieldGroupMap = useMemo(() => buildFieldGroupMap(columns), [columns]);
	const defaultSegmentOrders = useMemo(() => buildSegmentOrdersMap(columns), [columns]);
	const segmentOrdersKey = useMemo(
		() => JSON.stringify(defaultSegmentOrders),
		[defaultSegmentOrders],
	);
	const prevSegmentOrdersKeyRef = useRef(segmentOrdersKey);

	const [internalColumnOrder, setInternalColumnOrder] = useState<(keyof T)[]>(() => {
		const stored = (storage?.getItem('columns.sorted') || []) as (keyof T)[];
		const fallback = getColumnFields(columns);
		return mergeColumnOrder(stored.length ? stored : fallback, fallback);
	});

	const [internalSegmentOrders, setInternalSegmentOrders] = useState<Record<string, string[]>>(
		() => {
			const stored = (storage?.getItem('columns.segments') || {}) as Record<string, string[]>;
			return mergeSegmentOrders(stored, defaultSegmentOrders);
		},
	);

	const columnOrder = initialColumnOrder ?? internalColumnOrder;
	const segmentOrders = internalSegmentOrders;

	const setColumnOrder = useCallback(
		(newOrder: (keyof T)[]) => {
			if (initialColumnOrder) {
				onInitialColumnOrder?.(newOrder);
			} else {
				setInternalColumnOrder(newOrder);
				storage?.setItem('columns.sorted', newOrder);
			}
		},
		[initialColumnOrder, onInitialColumnOrder, storage],
	);

	const setSegmentOrders = useCallback(
		(next: Record<string, string[]>) => {
			setInternalSegmentOrders(next);
			storage?.setItem('columns.segments', next);
		},
		[storage],
	);

	useEffect(() => {
		if (prevFieldsKeyRef.current === fieldsKey) {
			return;
		}
		prevFieldsKeyRef.current = fieldsKey;

		if (initialColumnOrder) {
			const synced = mergeColumnOrder(initialColumnOrder, fields);
			if (synced.length !== initialColumnOrder.length) {
				onInitialColumnOrder?.(synced);
			}
			return;
		}

		setInternalColumnOrder((prev) => {
			const synced = mergeColumnOrder(prev, fields);
			storage?.setItem('columns.sorted', synced);
			return synced;
		});
	}, [fieldsKey, fields, initialColumnOrder, onInitialColumnOrder, storage]);

	useEffect(() => {
		if (prevSegmentOrdersKeyRef.current === segmentOrdersKey) {
			return;
		}
		prevSegmentOrdersKeyRef.current = segmentOrdersKey;

		setInternalSegmentOrders((prev) => {
			const synced = mergeSegmentOrders(prev, defaultSegmentOrders);
			storage?.setItem('columns.segments', synced);
			return synced;
		});
	}, [defaultSegmentOrders, segmentOrdersKey, storage]);

	const sortColumn = useCallback(
		(dragField: keyof T, dropField: keyof T) => {
			const dragGroup = fieldGroupMap.get(dragField) ?? ROOT_COLUMN_GROUP;
			const dropGroup = fieldGroupMap.get(dropField) ?? ROOT_COLUMN_GROUP;
			if (dragGroup !== dropGroup) {
				return;
			}

			const prev = columnOrder;
			const groupFields = prev.filter(
				(field) => (fieldGroupMap.get(field) ?? ROOT_COLUMN_GROUP) === dragGroup,
			);
			const dragIndex = groupFields.indexOf(dragField);
			const dropIndex = groupFields.indexOf(dropField);
			if (dragIndex === -1 || dropIndex === -1) {
				return;
			}

			const nextGroupFields = [...groupFields];
			const [dragged] = nextGroupFields.splice(dragIndex, 1);
			if (dragged === undefined) {
				return;
			}
			nextGroupFields.splice(dropIndex, 0, dragged);

			let groupIndex = 0;
			const nextOrder = prev.map((field) => {
				if ((fieldGroupMap.get(field) ?? ROOT_COLUMN_GROUP) !== dragGroup) {
					return field;
				}
				const nextField = nextGroupFields[groupIndex];
				groupIndex += 1;
				return nextField ?? field;
			});

			setColumnOrder(nextOrder);
		},
		[columnOrder, fieldGroupMap, setColumnOrder],
	);

	const sortColumnSegment = useCallback(
		(dragKey: string, dropKey: string, parentKey: string) => {
			if (dragKey === dropKey) {
				return;
			}

			const prevKeys = segmentOrders[parentKey] ?? defaultSegmentOrders[parentKey] ?? [];
			const dragIndex = prevKeys.indexOf(dragKey);
			const dropIndex = prevKeys.indexOf(dropKey);
			if (dragIndex === -1 || dropIndex === -1) {
				return;
			}

			const nextKeys = [...prevKeys];
			const [dragged] = nextKeys.splice(dragIndex, 1);
			if (dragged === undefined) {
				return;
			}
			nextKeys.splice(dropIndex, 0, dragged);

			setSegmentOrders({
				...segmentOrders,
				[parentKey]: nextKeys,
			});
		},
		[defaultSegmentOrders, segmentOrders, setSegmentOrders],
	);

	return {
		columnOrder,
		segmentOrders,
		setColumnOrder,
		setSegmentOrders,
		sortColumn,
		sortColumnSegment,
		setInternalColumnOrder,
		fieldGroupMap,
	};
}
