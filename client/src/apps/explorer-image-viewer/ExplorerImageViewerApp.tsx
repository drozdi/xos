import { Button, Flex } from 'antd';

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
		<Flex vertical gap="small" style={{ height: '100%', padding: 16, minHeight: 0 }}>
			<Flex justify="flex-end">
				<Button size="small" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Flex>
			<div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{url ? (
					<img
						src={url}
						alt={currentPath ?? 'image'}
						style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
					/>
				) : (
					'Откройте изображение'
				)}
			</div>
		</Flex>
	);
}
