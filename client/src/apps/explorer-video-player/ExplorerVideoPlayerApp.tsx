import { Button, Flex, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

export default function ExplorerVideoPlayerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-video-player',
		fileTypes: ['video'],
	});
	const [current, setCurrent] = useState<string | null>(null);
	const [playlist, setPlaylist] = useState<string[]>([]);
	const url = useExplorerMediaUrl(current);

	useWindowTitle(current ? getExplorerFileName(current) : 'Видеоплеер');

	useEffect(() => {
		if (!currentPath) {
			return;
		}
		setPlaylist((items) => (items.includes(currentPath) ? items : [...items, currentPath]));
		setCurrent((prev) => prev ?? currentPath);
	}, [currentPath]);

	return (
		<Flex vertical gap="small" style={{ height: '100%', padding: 16 }}>
			<Flex justify="flex-end">
				<Button size="small" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Flex>
			{url ? (
				<video src={url} controls style={{ width: '100%', maxHeight: 420 }} />
			) : (
				<Typography.Text>Откройте видеофайл</Typography.Text>
			)}
			<Flex vertical gap={4}>
				<Typography.Text strong style={{ fontSize: 13 }}>
					Плейлист
				</Typography.Text>
				{playlist.map((item) => (
					<Flex key={item} justify="space-between" align="center">
						<Typography.Text style={{ fontSize: 13 }}>{getExplorerFileName(item)}</Typography.Text>
						<Button type="text" size="small" onClick={() => setCurrent(item)}>
							▶
						</Button>
					</Flex>
				))}
			</Flex>
		</Flex>
	);
}
