import { useCallback, useState } from 'react';
import type { ColumnEntity, TableStorage } from '../type';

export function useColumnWidth<T>(
	columns: ColumnEntity<T>[],
	columnOrder: (keyof T)[],
	storage?: TableStorage,
	initialColumnWidth?: Record<keyof T, number>,
	onInitialColumnResize?: (
		column: ColumnEntity<T>,
		width: number,
		nextWidth: number,
	) => void,
) {
	const [internalWidths, setInternalWidths] = useState<Partial<Record<keyof T, number>>>(
		() => {
			if (initialColumnWidth) {
				return initialColumnWidth;
			}
			const widths: Partial<Record<keyof T, number>> = {};
			columns.forEach((column: ColumnEntity<T>) => {
				if (!column?.field) {
					return;
				}
				widths[column.field as keyof T] = (storage?.getItem(
					`columns.${String(column.field)}.width`,
				) || column.width) as number;
			});
			return widths;
		},
	);

	const columnWidths = initialColumnWidth ?? internalWidths;
	const setColumnWidths = initialColumnWidth ? () => {} : setInternalWidths;

	const resizeColumn = useCallback(
		(column: ColumnEntity<T>, width: number, nextWidth: number) => {
			if (!column?.field) {
				return;
			}
			setColumnWidths((prev) => {
				const next: Partial<Record<keyof T, number>> = {
					...prev,
					[column.field as keyof T]: width,
				};
				if (nextWidth !== undefined && column.field) {
					const idx = columnOrder.indexOf(column.field as keyof T);
					const nextField = columnOrder[idx + 1];
					if (nextField) {
						next[nextField] = nextWidth;
					}
				}
				if (storage && !initialColumnWidth) {
					storage.setItem(`columns.${String(column.field)}.width`, width);
					if (nextWidth !== undefined) {
						const idx = columnOrder.indexOf(column.field as keyof T);
						const nextField = columnOrder[idx + 1];
						if (nextField) {
							storage.setItem(`columns.${String(nextField)}.width`, nextWidth);
						}
					}
				}
				return next;
			});
			onInitialColumnResize?.(column, width, nextWidth);
		},
		[columnOrder, storage, initialColumnWidth, onInitialColumnResize],
	);

	const getColumnWidth = useCallback(
		(column: ColumnEntity<T>) => {
			if (column.isGroup) {
				return 72;
			}
			return columnWidths[column.field as keyof T] || undefined;
		},
		[columnWidths],
	);

	return {
		columnWidths,
		resizeColumn,
		getColumnWidth,
		setInternalWidths: setColumnWidths,
	};
}
