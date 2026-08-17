import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { userDataApi } from '@/core/api/endpoints/userData';
import { queryKeys } from '@/core/api/queryKeys';

import { isBoardFiltersActive, toBoardFilterApiParams } from '../boardFilterUtils';
import {
	BOARD_PREFS,
	boardFiltersPrefsSchema,
	boardUiFiltersSchema,
	emptyBoardUiFilters,
	type BoardUiFilters,
} from '../boardPrefs';

export function useBoardFilters(boardId: number) {
	const [filters, setFiltersState] = useState<BoardUiFilters>(emptyBoardUiFilters);
	const [restored, setRestored] = useState(false);
	const prefsRef = useRef<Record<string, BoardUiFilters>>({});

	useEffect(() => {
		let cancelled = false;
		setRestored(false);
		setFiltersState(emptyBoardUiFilters());

		void (async () => {
			try {
				const dto = await userDataApi.getOptional(BOARD_PREFS.filters);
				if (dto) {
					const parsed = boardFiltersPrefsSchema.parse(dto.value);
					prefsRef.current = parsed.boards;
					const saved = parsed.boards[String(boardId)];
					if (!cancelled && saved) {
						setFiltersState(boardUiFiltersSchema.parse(saved));
					}
				} else {
					prefsRef.current = {};
				}
			} catch {
				prefsRef.current = {};
			} finally {
				if (!cancelled) {
					setRestored(true);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [boardId]);

	useEffect(() => {
		if (!restored) {
			return;
		}
		const timer = window.setTimeout(() => {
			const nextBoards = {
				...prefsRef.current,
				[String(boardId)]: filters,
			};
			prefsRef.current = nextBoards;
			void userDataApi.upsert({
				code: BOARD_PREFS.filters,
				value: { boards: nextBoards },
			});
		}, 500);

		return () => window.clearTimeout(timer);
	}, [boardId, filters, restored]);

	const hasActiveFilters = isBoardFiltersActive(filters);
	const apiParams = useMemo(() => toBoardFilterApiParams(filters), [filters]);

	const filterQuery = useQuery({
		queryKey: queryKeys.board.filter(boardId, apiParams),
		queryFn: () => boardApi.filterCards(boardId, apiParams),
		enabled: restored && hasActiveFilters,
	});

	const matchingIds = useMemo(() => {
		if (!hasActiveFilters) {
			return null;
		}
		return new Set(filterQuery.data?.card_ids ?? []);
	}, [filterQuery.data, hasActiveFilters]);

	const setFilters = useCallback((next: BoardUiFilters) => {
		setFiltersState(next);
	}, []);

	return {
		filters,
		setFilters,
		matchingIds,
		hasActiveFilters,
		isFilterLoading: filterQuery.isLoading,
		restored,
	};
}

export async function saveLastBoardId(boardId: number): Promise<void> {
	await userDataApi.upsert({ code: BOARD_PREFS.lastBoardId, value: boardId });
}

export async function loadLastBoardId(): Promise<number | null> {
	const dto = await userDataApi.getOptional(BOARD_PREFS.lastBoardId);
	return dto && typeof dto.value === 'number' ? dto.value : null;
}
