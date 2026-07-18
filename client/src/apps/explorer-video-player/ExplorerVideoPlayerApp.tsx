import { Group, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useExplorerMediaUrl, useExplorerOpenFile } from '@/features/explorer/useExplorerMediaUrl';

export default function ExplorerVideoPlayerApp() {
	const openedPath = useExplorerOpenFile('explorer-video-player');
	const [playlist, setPlaylist] = useState<string[]>([]);
	const [current, setCurrent] = useState<string | null>(null);
	const url = useExplorerMediaUrl(current);

	useEffect(() => {
		if (!openedPath) {
			return;
		}
		setPlaylist((items) => (items.includes(openedPath) ? items : [...items, openedPath]));
		setCurrent((prev) => prev ?? openedPath);
	}, [openedPath]);

	return (
		<Stack h="100%" p="md" gap="sm">
			{url ? (
				<video src={url} controls style={{ width: '100%', maxHeight: 420 }} />
			) : (
				<Text>Откройте видео через Проводник</Text>
			)}
			<Stack gap={4}>
				<Text size="sm" fw={600}>
					Плейлист
				</Text>
				{playlist.map((item) => (
					<Group key={item} justify="space-between">
						<Text size="sm">{item}</Text>
						<button type="button" onClick={() => setCurrent(item)}>
							▶
						</button>
					</Group>
				))}
			</Stack>
		</Stack>
	);
}
