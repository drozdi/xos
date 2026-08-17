import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

export function useWikilinkNavigate(vaultId: number, onNavigate: (path: string) => void) {
	const queryClient = useQueryClient();

	return useCallback(
		async (title: string) => {
			const normalizedTitle = title.trim();
			if (!normalizedTitle) {
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
		[onNavigate, queryClient, vaultId],
	);
}
