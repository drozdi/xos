import { Box, Button, Group, Stack } from '@mantine/core';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

export default function ExplorerImageViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-image-viewer',
		fileTypes: ['image'],
	});
	const url = useExplorerMediaUrl(currentPath);

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Изображения');

	return (
		<Stack h="100%" p="md" gap="sm" style={{ minHeight: 0 }}>
			<Group justify="flex-end">
				<Button variant="default" size="xs" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Group>
			<Box style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{url ? (
					<img
						src={url}
						alt={currentPath ?? 'image'}
						style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
					/>
				) : (
					'Откройте изображение'
				)}
			</Box>
		</Stack>
	);
}
