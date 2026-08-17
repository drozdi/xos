import { Anchor, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconBookmark } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

interface BookmarksPanelProps {
	vaultId: number;
	onNavigateNote: (path: string) => void;
}

export function BookmarksPanel({ vaultId, onNavigateNote }: BookmarksPanelProps) {
	const bookmarksQuery = useQuery({
		queryKey: queryKeys.pkb.bookmarks(vaultId),
		queryFn: () => pkbApi.bookmarks(vaultId),
	});

	const items = bookmarksQuery.data?.items ?? [];

	return (
		<Stack gap="xs" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
			<Group gap={6}>
				<IconBookmark size={14} />
				<Title order={6}>Закладки</Title>
			</Group>
			{bookmarksQuery.isLoading ? (
				<Loader size="xs" />
			) : bookmarksQuery.isError ? (
				<Text size="xs" c="red">
					Не удалось загрузить закладки
				</Text>
			) : items.length === 0 ? (
				<Text size="xs" c="dimmed">
					Нет закладок
				</Text>
			) : (
				<Stack gap={4}>
					{items.map((item) => (
						<Anchor
							key={item.path}
							size="xs"
							lineClamp={1}
							onClick={() => onNavigateNote(item.path)}
							style={{ cursor: 'pointer' }}
						>
							{item.title}
						</Anchor>
					))}
				</Stack>
			)}
		</Stack>
	);
}
