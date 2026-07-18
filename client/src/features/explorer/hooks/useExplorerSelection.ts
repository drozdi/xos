import { useCallback, useState, type MouseEvent } from 'react';

export function useExplorerSelection<T extends { path: string }>(items: T[]) {
	const [selected, setSelected] = useState<string[]>([]);
	const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

	const clearSelection = useCallback(() => {
		setSelected([]);
		setAnchorIndex(null);
	}, []);

	const handleSelect = useCallback(
		(path: string, index: number, event: MouseEvent) => {
			if (event.ctrlKey || event.metaKey) {
				setSelected((prev) =>
					prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path],
				);
				setAnchorIndex(index);
				return;
			}

			if (event.shiftKey && anchorIndex !== null) {
				const sorted = [anchorIndex, index].sort((left, right) => left - right);
				const start = sorted[0] ?? 0;
				const end = sorted[1] ?? start;
				setSelected(items.slice(start, end + 1).map((item) => item.path));
				return;
			}

			setSelected([path]);
			setAnchorIndex(index);
		},
		[anchorIndex, items],
	);

	return {
		selected,
		setSelected,
		handleSelect,
		clearSelection,
	};
}
