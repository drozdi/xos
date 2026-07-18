import { Box, Stack } from '@mantine/core';

import { useExplorerMediaUrl, useExplorerOpenFile } from '@/features/explorer/useExplorerMediaUrl';

export default function ExplorerImageViewerApp() {
	const path = useExplorerOpenFile('explorer-image-viewer');
	const url = useExplorerMediaUrl(path);

	return (
		<Stack h="100%" p="md" align="center" justify="center">
			{url ? (
				<Box style={{ maxWidth: '100%', maxHeight: '100%' }}>
					<img
						src={url}
						alt={path ?? 'image'}
						style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
					/>
				</Box>
			) : (
				'Откройте изображение через Проводник'
			)}
		</Stack>
	);
}
