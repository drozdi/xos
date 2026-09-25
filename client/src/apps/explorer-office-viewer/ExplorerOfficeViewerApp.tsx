import { Alert, Box, Center, Loader, ScrollArea, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import mammoth from 'mammoth';
import { useEffect } from 'react';

import { apiClient } from '@/core/api/client';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

async function fetchDocxHtml(path: string): Promise<string> {
	const { data } = await apiClient.get<ArrayBuffer>('/api/explorer/content', {
		params: { path },
		responseType: 'arraybuffer',
	});
	const result = await mammoth.convertToHtml({ arrayBuffer: data });
	return result.value;
}

export default function ExplorerOfficeViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-office-viewer',
		fileTypes: ['document'],
		extensions: ['docx', 'doc'],
	});

	const ext = currentPath?.split('.').pop()?.toLowerCase() ?? '';
	const isDocx = ext === 'docx';

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Документы');

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
				e.preventDefault();
				void openFile();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [openFile]);

	const htmlQuery = useQuery({
		queryKey: ['explorer', 'office', currentPath ?? ''],
		queryFn: () => fetchDocxHtml(currentPath!),
		enabled: Boolean(currentPath) && isDocx,
	});

	return (
		<Box h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			{!currentPath ? (
				<Center style={{ flex: 1 }} p="md">
					<Text c="dimmed">Файл → Открыть… (DOCX) или из Проводника</Text>
				</Center>
			) : !isDocx ? (
				<Center style={{ flex: 1 }} p="md">
					<Alert color="yellow" title="Формат не поддерживается" maw={420}>
						Предпросмотр доступен для DOCX. Файл «{getExplorerFileName(currentPath)}» откройте в
						соответствующем приложении.
					</Alert>
				</Center>
			) : htmlQuery.isLoading ? (
				<Center style={{ flex: 1 }}>
					<Loader size="sm" />
				</Center>
			) : htmlQuery.isError ? (
				<Center style={{ flex: 1 }}>
					<Text c="red">Не удалось открыть документ</Text>
				</Center>
			) : (
				<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars p="md">
					<Box
						className="office-preview"
						dangerouslySetInnerHTML={{ __html: htmlQuery.data ?? '' }}
						style={{
							maxWidth: 800,
							margin: '0 auto',
							lineHeight: 1.55,
							fontSize: 15,
						}}
					/>
				</ScrollArea>
			)}
		</Box>
	);
}
