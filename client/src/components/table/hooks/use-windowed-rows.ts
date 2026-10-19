import { useLayoutEffect, useRef, useState } from 'react';

export const WINDOWED_ROWS_THRESHOLD = 50;
const OVERSCAN_ROWS = 10;
const DEFAULT_ROW_HEIGHT = 40;

interface WindowedRowsRange {
	start: number;
	end: number;
	rowHeight: number;
}

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
	let current = element?.parentElement ?? null;
	while (current) {
		const { overflowY } = getComputedStyle(current);
		if (overflowY === 'auto' || overflowY === 'scroll') {
			return current;
		}
		current = current.parentElement;
	}
	return null;
}

/**
 * Renders only rows near the viewport of the nearest scrollable ancestor.
 * `start` is kept even so `nth-of-type` striping stays stable while scrolling.
 */
export function useWindowedRows(count: number, enabled: boolean) {
	const active = enabled && count > WINDOWED_ROWS_THRESHOLD;
	const topSpacerRef = useRef<HTMLTableRowElement>(null);
	const bottomSpacerRef = useRef<HTMLTableRowElement>(null);
	const [range, setRange] = useState<WindowedRowsRange>(() => ({
		start: 0,
		end: Math.min(count, WINDOWED_ROWS_THRESHOLD),
		rowHeight: DEFAULT_ROW_HEIGHT,
	}));

	useLayoutEffect(() => {
		if (!active) {
			return undefined;
		}
		const topSpacer = topSpacerRef.current;
		const tbody = topSpacer?.parentElement ?? null;
		const scroller = findScrollParent(tbody);
		if (!tbody || !scroller) {
			setRange((prev) => ({ ...prev, start: 0, end: count }));
			return undefined;
		}

		let frame = 0;
		const update = () => {
			frame = 0;
			setRange((prev) => {
				const rendered = prev.end - prev.start;
				const spacers =
					(topSpacerRef.current?.offsetHeight ?? 0) + (bottomSpacerRef.current?.offsetHeight ?? 0);
				const measured = rendered > 0 ? (tbody.offsetHeight - spacers) / rendered : 0;
				const rowHeight = measured > 0 ? measured : prev.rowHeight;
				const tbodyTop =
					tbody.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
				const viewTop = scroller.scrollTop - tbodyTop;
				const rawStart = Math.floor(viewTop / rowHeight) - OVERSCAN_ROWS;
				const start = Math.max(0, Math.min(count, rawStart - (rawStart % 2)));
				const end = Math.max(
					start,
					Math.min(count, Math.ceil((viewTop + scroller.clientHeight) / rowHeight) + OVERSCAN_ROWS),
				);
				const sameHeight = Math.abs(prev.rowHeight - rowHeight) < 0.5;
				return prev.start === start && prev.end === end && sameHeight
					? prev
					: { start, end, rowHeight: sameHeight ? prev.rowHeight : rowHeight };
			});
		};
		const schedule = () => {
			if (frame === 0) {
				frame = requestAnimationFrame(update);
			}
		};

		update();
		scroller.addEventListener('scroll', schedule, { passive: true });
		const observer = new ResizeObserver(schedule);
		observer.observe(scroller);
		return () => {
			cancelAnimationFrame(frame);
			scroller.removeEventListener('scroll', schedule);
			observer.disconnect();
		};
	}, [active, count]);

	const start = active ? Math.min(range.start, count) : 0;
	const end = active ? Math.min(range.end, count) : count;

	return {
		active,
		start,
		end,
		topSpacerRef,
		bottomSpacerRef,
		topHeight: start * range.rowHeight,
		bottomHeight: (count - end) * range.rowHeight,
	};
}
