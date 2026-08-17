import { Alert, Anchor, Loader, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

import { TagBadgeList } from './TagBadgeList';

interface BacklinksPanelProps {
	vaultId: number;
	notePath: string | null;
	onNavigateNote: (path: string) => void;
}

export function BacklinksPanel({ vaultId, notePath, onNavigateNote }: BacklinksPanelProps) {
	const notesQuery = useQuery({
		queryKey: queryKeys.pkb.notes(vaultId),
		queryFn: () => pkbApi.notes(vaultId),
	});

	const backlinksQuery = useQuery({
		queryKey: queryKeys.pkb.backlinks(vaultId, notePath ?? ''),
		queryFn: () => pkbApi.backlinks(vaultId, notePath!),
		enabled: Boolean(notePath),
	});

	const currentNote = notesQuery.data?.notes.find((note) => note.path === notePath) ?? null;

	if (!notePath) {
		return (
			<Stack gap="md" p="md" h="100%">
				<Text size="sm" c="dimmed">
					Выберите заметку, чтобы увидеть обратные ссылки и теги
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap="lg" p="md" h="100%" style={{ minHeight: 0 }}>
			<Stack gap="xs">
				<Title order={6}>Теги</Title>
				{notesQuery.isLoading ? (
					<Loader size="xs" />
				) : notesQuery.isError ? (
					<Text size="xs" c="red">
						Не удалось загрузить теги
					</Text>
				) : (
					<TagBadgeList tags={currentNote?.tags ?? []} />
				)}
			</Stack>

			<Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
				<Title order={6}>Обратные ссылки</Title>
				{backlinksQuery.isLoading ? (
					<Loader size="xs" />
				) : backlinksQuery.isError ? (
					<Alert color="red" title="Ошибка">
						Не удалось загрузить обратные ссылки
					</Alert>
				) : backlinksQuery.data?.backlinks.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет входящих ссылок
					</Text>
				) : (
					<Stack gap={6}>
						{backlinksQuery.data?.backlinks.map((link) => (
							<Anchor
								key={`${link.sourcePath}-${link.linkType}-${link.alias ?? ''}`}
								component="button"
								type="button"
								size="sm"
								onClick={() => onNavigateNote(link.sourcePath)}
								style={{ textAlign: 'left' }}
							>
								{link.sourceTitle}
							</Anchor>
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
}
