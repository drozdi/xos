import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { queryKeys } from '@/core/api/queryKeys';

const IBLOCK_WIKILINK_RE = /^(note|recipe|notes|recipes):(\d+)$/i;

/** `[[note:12]]` / `[[recipe:5]]` → open IBlock consumer apps. */
export function parseIblockWikilink(title: string): { appId: 'note' | 'recipe'; id: number } | null {
	const match = title.trim().match(IBLOCK_WIKILINK_RE);
	if (!match) {
		return null;
	}
	const kind = (match[1] ?? '').toLowerCase();
	const id = Number.parseInt(match[2] ?? '', 10);
	if (!Number.isFinite(id) || id <= 0) {
		return null;
	}
	const appId = kind === 'recipe' || kind === 'recipes' ? 'recipe' : 'note';
	return { appId, id };
}

export function useWikilinkNavigate(vaultId: number, onNavigate: (path: string) => void) {
	const queryClient = useQueryClient();
	const launchApp = useAppManager((s) => s.launchApp);

	return useCallback(
		async (title: string) => {
			const normalizedTitle = title.trim();
			if (!normalizedTitle) {
				return;
			}

			const iblock = parseIblockWikilink(normalizedTitle);
			if (iblock) {
				void launchApp(iblock.appId, {
					instanceKey: String(iblock.id),
					props: { id: iblock.id },
				});
				return;
			}

			try {
				const result = await queryClient.fetchQuery({
					queryKey: queryKeys.pkb.noteByTitle(vaultId, normalizedTitle),
					queryFn: () => pkbApi.noteByTitle(vaultId, normalizedTitle),
				});

				if (result.path && !result.ambiguous) {
					onNavigate(result.path);
					return;
				}

				if (result.ambiguous && result.candidates && result.candidates.length > 0) {
					onNavigate(result.candidates[0]!.path);
					return;
				}

				notifications.show({
					color: 'yellow',
					message: `Заметка «${normalizedTitle}» не найдена`,
				});
			} catch {
				notifications.show({
					color: 'red',
					message: 'Не удалось открыть заметку по ссылке',
				});
			}
		},
		[launchApp, onNavigate, queryClient, vaultId],
	);
}
