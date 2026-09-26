import { Modal, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, type ReactElement } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { queryKeys } from '@/core/api/queryKeys';

const IBLOCK_WIKILINK_RE = /^(note|recipe|notes|recipes):(\d+)$/i;

type AmbiguousCandidate = { path: string; title: string };

type AmbiguousState = {
	title: string;
	candidates: AmbiguousCandidate[];
};

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

export function useWikilinkNavigate(
	vaultId: number,
	onNavigate: (path: string) => void,
): {
	navigate: (title: string) => Promise<void>;
	ambiguousPicker: ReactElement | null;
} {
	const queryClient = useQueryClient();
	const launchApp = useAppManager((s) => s.launchApp);
	const [ambiguous, setAmbiguous] = useState<AmbiguousState | null>(null);

	const navigate = useCallback(
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
					setAmbiguous({
						title: normalizedTitle,
						candidates: result.candidates,
					});
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

	const ambiguousPicker =
		ambiguous === null ? null : (
			<Modal
				opened
				onClose={() => setAmbiguous(null)}
				title="Несколько заметок с таким названием"
				centered
			>
				<Stack gap="sm">
					<Text size="sm" c="dimmed">
						Ссылка [[{ambiguous.title}]] неоднозначна. Выберите заметку:
					</Text>
					<Select
						label="Заметка"
						placeholder="Выберите путь"
						data={ambiguous.candidates.map((candidate) => ({
							value: candidate.path,
							label: `${candidate.title} — ${candidate.path}`,
						}))}
						searchable
						nothingFoundMessage="Нет вариантов"
						onChange={(path) => {
							if (!path) {
								return;
							}
							setAmbiguous(null);
							onNavigate(path);
						}}
					/>
				</Stack>
			</Modal>
		);

	return { navigate, ambiguousPicker };
}
