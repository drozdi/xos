/**
 * Prefer Mercure (when hub configured), else SSE fetch stream + Bearer.
 * Falls back to polling when stream fails.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { apiBaseURL } from '@/core/api/client';
import {
	boardChangesResponseSchema,
	boardRealtimeConfigSchema,
	type BoardRealtimeConfig,
} from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';
import { getAccessToken } from '@/core/auth/tokenStorage';

import { useBoardChangesPolling } from './useBoardChangesPolling';

function invalidateBoard(
	queryClient: ReturnType<typeof useQueryClient>,
	boardId: number,
	cardIds?: number[],
): void {
	void queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
	void queryClient.invalidateQueries({ queryKey: ['board', 'filter', boardId] });
	void queryClient.invalidateQueries({ queryKey: queryKeys.board.members(boardId) });
	if (cardIds) {
		for (const cardId of cardIds) {
			void queryClient.invalidateQueries({ queryKey: queryKeys.board.card(cardId) });
		}
	}
}

async function fetchRealtimeConfig(boardId: number): Promise<BoardRealtimeConfig | null> {
	const token = getAccessToken();
	if (!token) {
		return null;
	}
	try {
		const res = await fetch(`${apiBaseURL}/api/board/boards/${boardId}/realtime`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});
		if (!res.ok) {
			return null;
		}
		return boardRealtimeConfigSchema.parse(await res.json());
	} catch {
		return null;
	}
}

export function useBoardRealtime(boardId: number, enabled = true): void {
	const queryClient = useQueryClient();
	const sinceRef = useRef<string | null>(null);
	const [usePolling, setUsePolling] = useState(false);

	useEffect(() => {
		sinceRef.current = null;
		setUsePolling(false);
	}, [boardId]);

	useEffect(() => {
		if (!enabled || boardId < 1) {
			return;
		}

		const ac = new AbortController();
		let cancelled = false;
		let mercureEs: EventSource | null = null;

		const runSse = async () => {
			while (!cancelled && !ac.signal.aborted) {
				const token = getAccessToken();
				if (!token) {
					setUsePolling(true);
					return;
				}

				const params = new URLSearchParams();
				if (sinceRef.current) {
					params.set('since', sinceRef.current);
				}
				params.set('max_seconds', '55');
				const url = `${apiBaseURL}/api/board/boards/${boardId}/events?${params.toString()}`;

				try {
					const res = await fetch(url, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${token}`,
							Accept: 'text/event-stream',
						},
						signal: ac.signal,
					});
					if (!res.ok || !res.body) {
						throw new Error(`SSE HTTP ${res.status}`);
					}

					setUsePolling(false);

					const reader = res.body.getReader();
					const decoder = new TextDecoder();
					let buffer = '';

					while (!cancelled) {
						const { done, value } = await reader.read();
						if (done) {
							break;
						}
						buffer += decoder.decode(value, { stream: true });
						const parts = buffer.split('\n\n');
						buffer = parts.pop() ?? '';
						for (const chunk of parts) {
							const lines = chunk.split('\n');
							let eventName = 'message';
							const dataLines: string[] = [];
							for (const line of lines) {
								if (line.startsWith('event:')) {
									eventName = line.slice(6).trim();
								} else if (line.startsWith('data:')) {
									dataLines.push(line.slice(5).trim());
								}
							}
							if (eventName !== 'board_delta' || dataLines.length === 0) {
								continue;
							}
							try {
								const parsed = boardChangesResponseSchema.parse(JSON.parse(dataLines.join('\n')));
								if (parsed.server_time) {
									sinceRef.current = parsed.server_time;
								}
								if (parsed.has_changes) {
									invalidateBoard(queryClient, boardId, parsed.updated_card_ids);
								}
							} catch {
								/* ignore malformed */
							}
						}
					}
				} catch {
					if (cancelled || ac.signal.aborted) {
						return;
					}
					setUsePolling(true);
					await new Promise((r) => setTimeout(r, 3000));
					if (!cancelled) {
						setUsePolling(false);
					}
				}
			}
		};

		const run = async () => {
			const cfg = await fetchRealtimeConfig(boardId);
			if (cancelled) {
				return;
			}

			if (
				cfg?.transport === 'mercure' &&
				cfg.mercure.enabled &&
				cfg.mercure.hub_url &&
				cfg.mercure.topic &&
				cfg.mercure.token
			) {
				const hub = cfg.mercure.hub_url.replace(/\/$/, '');
				const url = new URL(`${hub}/.well-known/mercure`);
				url.searchParams.append('topic', cfg.mercure.topic);
				url.searchParams.set('authorization', cfg.mercure.token);

				try {
					mercureEs = new EventSource(url.toString());
					setUsePolling(false);
					mercureEs.onmessage = () => {
						invalidateBoard(queryClient, boardId);
					};
					mercureEs.onerror = () => {
						mercureEs?.close();
						mercureEs = null;
						if (!cancelled) {
							void runSse();
						}
					};
					return;
				} catch {
					/* fall through to SSE */
				}
			}

			await runSse();
		};

		void run();

		return () => {
			cancelled = true;
			ac.abort();
			mercureEs?.close();
		};
	}, [boardId, enabled, queryClient]);

	useBoardChangesPolling(boardId, enabled && usePolling);
}
