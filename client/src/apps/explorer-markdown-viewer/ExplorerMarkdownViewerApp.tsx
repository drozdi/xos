import { Box, Button, Center, Group, Loader, ScrollArea, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

import classes from './markdownViewer.module.css';

export default function ExplorerMarkdownViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-markdown-viewer',
		fileTypes: ['markdown'],
		extensions: ['md', 'markdown', 'mdown'],
	});

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Markdown');

	const contentQuery = useQuery({
		queryKey: ['explorer', 'markdown', currentPath],
		queryFn: () => fetchExplorerText(currentPath!),
		enabled: Boolean(currentPath),
	});

	const markdown = contentQuery.data ?? '';

	const remarkPlugins = useMemo(() => [remarkGfm], []);

	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 'var(--mantine-spacing-md)',
				gap: 'var(--mantine-spacing-sm)',
			}}
		>
			<Group justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }}>
				<Text size="sm" c="dimmed" truncate title={currentPath ?? ''}>
					{currentPath ? getExplorerFileName(currentPath) : 'Откройте Markdown-файл'}
				</Text>
				<Button variant="default" size="xs" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Group>

			<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
				{!currentPath ? (
					<Center h={200}>
						<Text c="dimmed">Выберите файл .md через «Открыть…» или из проводника</Text>
					</Center>
				) : contentQuery.isLoading ? (
					<Center h={200}>
						<Loader size="sm" />
					</Center>
				) : contentQuery.isError ? (
					<Center h={200}>
						<Text c="red">Не удалось загрузить файл</Text>
					</Center>
				) : (
					<Box className={classes.markdownViewer} maw={900} mx="auto" pb="xl">
						<ReactMarkdown remarkPlugins={remarkPlugins}>{markdown}</ReactMarkdown>
					</Box>
				)}
			</ScrollArea>
		</Box>
	);
}
