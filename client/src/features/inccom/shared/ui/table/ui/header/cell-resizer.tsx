import { Box } from '@mantine/core';
import { useCallback, useEffect, useRef } from 'react';
import { useTableColumnSizingContext } from '../../context';
import classes from '../style.module.css';
import type {
	TableHeaderCellResizerProps
} from '../type';

const MIN_COLUMN_WIDTH = 50;

export function TableHeaderCellResizer<T = object>({
	column,
	...props
}: TableHeaderCellResizerProps<T>) {
	const { resizeColumn } = useTableColumnSizingContext<T>();

	const columnRef = useRef<HTMLDivElement>(null);
	const dragStateRef = useRef<{
		startX: number;
		currentWidth: number;
		nextWidth: number;
		th?: HTMLElement;
		nextTh?: HTMLElement;
	}>({
		startX: 0,
		currentWidth: 0,
		nextWidth: 0,
	});

	const isDraggingRef = useRef(false);

	const currentWidthRef = useRef<number>(0);
	const nextWidthRef = useRef<number>(0);

	const handleMouseMove = useCallback(
		(event: MouseEvent) => {
			if (!isDraggingRef.current) {
				return;
			}

			let deltaX = event.clientX - dragStateRef.current.startX;
			
			const maxShrinkCurrent = dragStateRef.current.currentWidth - MIN_COLUMN_WIDTH;
			const maxShrinkNext = dragStateRef.current.nextWidth - MIN_COLUMN_WIDTH;

			const constrainedDelta = Math.max(
				-maxShrinkCurrent,
				Math.min(deltaX, maxShrinkNext),
			);

			const finalCurrentWidth = dragStateRef.current.currentWidth + constrainedDelta;
			const finalNextWidth = (dragStateRef.current.nextWidth || 0) - constrainedDelta;

			currentWidthRef.current = finalCurrentWidth;
			nextWidthRef.current = finalNextWidth;

			if (dragStateRef.current.th) {
				dragStateRef.current.th.style.width = `${finalCurrentWidth}px`;
			}
			if (dragStateRef.current.nextTh) {
				dragStateRef.current.nextTh.style.width = `${finalNextWidth}px`;
			}
		},
		[],
	);

	const handleMouseUp = useCallback(() => {
		if (!isDraggingRef.current) {
			return;
		}

		resizeColumn?.(column, currentWidthRef.current, nextWidthRef.current);

		isDraggingRef.current = false;

		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}, [column, resizeColumn]);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (!columnRef.current) {
				return;
			}

			const th = columnRef.current.closest('th');
			
			if (!th) {
				return;
			}

			const nextTh = th?.nextElementSibling as HTMLTableCellElement;

			if (!nextTh) {
				return;
			}

			isDraggingRef.current = true;

			dragStateRef.current = {
				startX: e.clientX,
				currentWidth: th?.offsetWidth,
				nextWidth: nextTh?.offsetWidth,
				th, nextTh,
			};

			document.body.style.cursor = 'col-resize';
			document.body.style.userSelect = 'none';
		},
		[],
	);

	useEffect(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('blur', handleMouseUp);

		return () => {
			dragStateRef.current = {
				startX: 0,
				currentWidth: 0,
				nextWidth: 0,
			}

			document.body.style.cursor = '';
			document.body.style.userSelect = '';

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('blur', handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	if (!column.isResizable) {
		return null;
	}

	return (
		<Box
			{...props}
			ref={columnRef}
			onMouseDown={handleMouseDown}
			className={classes.resize}
			onClick={(event) => event.stopPropagation()}
		/>
	);
}
