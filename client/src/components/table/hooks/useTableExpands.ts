import { useCallback, useMemo, useState } from 'react';

import type { ExpandKind, TableExpandsState, ToggleExpandOptions } from '../type';
import { updateExpandKindKeys } from '../utils/expand-keys';

const EMPTY_EXPANDS: TableExpandsState = {
	group: [],
	grouped: [],
};

export function useTableExpands(allowMultiple: boolean) {
	const [expands, setExpands] = useState<TableExpandsState>(EMPTY_EXPANDS);

	const toggleExpand = useCallback(
		(
			expandKey: string | string[],
			kind: ExpandKind,
			options?: ToggleExpandOptions,
		) => {
			setExpands((prev) => ({
				...prev,
				[kind]: updateExpandKindKeys(prev[kind], expandKey, options, allowMultiple),
			}));
		},
		[allowMultiple],
	);

	const expandedSets = useMemo(
		() => ({
			group: new Set(expands.group),
			grouped: new Set(expands.grouped),
		}),
		[expands],
	);

	const isExpanded = useCallback(
		(expandKey: string, kind: ExpandKind) => expandedSets[kind].has(expandKey),
		[expandedSets],
	);

	return {
		expands,
		setExpands,
		expandedSets,
		toggleExpand,
		isExpanded,
	};
}
