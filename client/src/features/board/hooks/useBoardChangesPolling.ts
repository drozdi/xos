import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

const POLL_MS = 5000;

/** Polls GET /boards/{id}/changes and invalidates board cache when delta detected. */
export function useBoardChangesPolling(boardId: number, enabled = true): void {
	const queryClient = useQueryClient();
	const sinceRef = useRef<string | null>(null);

	const changesQuery = useQuery({
		queryKey: queryKeys.board.changes(boardId),
		queryFn: () => boardApi.boardChanges(boardId, sinceRef.current),
		enabled,
		refetchInterval: POLL_MS,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
	});

	useEffect(() => {
		sinceRef.current = null;
	}, [boardId]);

	useEffect(() => {
		const data = changesQuery.data;
		if (!data) {
			return;
		}

		if (data.has_changes) {
			void queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
			void queryClient.invalidateQueries({ queryKey: ['board', 'filter', boardId] });
			void queryClient.invalidateQueries({ queryKey: queryKeys.board.members(boardId) });
		}

		if (data.server_time) {
			sinceRef.current = data.server_time;
		}
	}, [boardId, changesQuery.data, queryClient]);
}
