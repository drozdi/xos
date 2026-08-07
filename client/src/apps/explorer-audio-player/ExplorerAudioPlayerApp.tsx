import { Button, Group, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

export default function ExplorerAudioPlayerApp() {
	const { currentPath } = useExplorerSatelliteFile({
		appId: 'explorer-audio-player',
		fileTypes: ['audio'],
	});
	const [current, setCurrent] = useState<string | null>(null);
	const [playlist, setPlaylist] = useState<string[]>([]);
	const url = useExplorerMediaUrl(current);

	useWindowTitle(current ? getExplorerFileName(current) : 'Аудиоплеер');

	useEffect(() => {
		if (!currentPath) {
			return;
		}
		setPlaylist((items) => (items.includes(currentPath) ? items : [...items, currentPath]));
		setCurrent((prev) => prev ?? currentPath);
	}, [currentPath]);

	return (
		<Stack h="100%" p="md" gap="sm">
			{url ? <audio src={url} controls style={{ width: '100%' }} /> : <Text>Откройте аудиофайл</Text>}
			<Stack gap={4}>
				<Text size="sm" fw={600}>
					Плейлист
				</Text>
				{playlist.map((item) => (
					<Group key={item} justify="space-between">
						<Text size="sm">{getExplorerFileName(item)}</Text>
						<Button variant="subtle" size="compact-xs" onClick={() => setCurrent(item)}>
							▶
						</Button>
					</Group>
				))}
			</Stack>
		</Stack>
	);
}
