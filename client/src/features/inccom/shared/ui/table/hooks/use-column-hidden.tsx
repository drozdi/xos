import { useCallback, useEffect, useRef, useState } from 'react';
import { getColumnFields, intersectFields } from '../utils/column-fields';
import type { ColumnEntity, TableStorage } from '../type';

export function useColumnHidden<T = object>(
	columns: ColumnEntity<T>[],
	storage?: TableStorage,
	initialHiddenColumns?: (keyof T)[],
	onInitialHiddenColumns?: (column: ColumnEntity<T>, hidden?: boolean) => void,
) {
	const fields = getColumnFields(columns);
	const fieldsKey = fields.join('|');
	const prevFieldsKeyRef = useRef(fieldsKey);

	const [internalHiddenColumns, setInternalHiddenColumns] = useState<(keyof T)[]>(() => {
		const stored = (storage?.getItem('columns.hidden') || initialHiddenColumns || []) as (keyof T)[];
		return intersectFields(stored, fields);
	});

	const hiddenColumns = initialHiddenColumns ?? internalHiddenColumns;

	useEffect(() => {
		if (prevFieldsKeyRef.current === fieldsKey) {
			return;
		}
		prevFieldsKeyRef.current = fieldsKey;

		if (initialHiddenColumns) {
			return;
		}

		setInternalHiddenColumns((prev) => {
			const synced = intersectFields(prev, fields);
			storage?.setItem('columns.hidden', synced);
			return synced;
		});
	}, [fieldsKey, fields, initialHiddenColumns, storage]);

	const toggleColumn = useCallback(
		(column: ColumnEntity<T>, hidden?: boolean) => {
			if (!column.isToggleable || !column.field) {
				return;
			}

			const field = column.field as keyof T;

			const resolveHidden = (prev: (keyof T)[]) => {
				if (hidden !== undefined) {
					return hidden
						? prev.includes(field)
							? prev
							: [...prev, field]
						: prev.filter((f) => f !== field);
				}
				return prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field];
			};

			if (initialHiddenColumns !== undefined) {
				const newHidden = resolveHidden(initialHiddenColumns);
				onInitialHiddenColumns?.(column, newHidden.includes(field));
				return;
			}

			setInternalHiddenColumns((prev) => {
				const newHidden = resolveHidden(prev);
				if (storage) {
					storage.setItem('columns.hidden', newHidden);
				}
				onInitialHiddenColumns?.(column, newHidden.includes(field));
				return newHidden;
			});
		},
		[storage, initialHiddenColumns, onInitialHiddenColumns],
	);

	return {
		hiddenColumns,
		toggleColumn,
		setInternalHiddenColumns,
	};
}
