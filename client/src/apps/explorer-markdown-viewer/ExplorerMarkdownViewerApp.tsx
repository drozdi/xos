import { Button, Flex, Spin, Typography } from 'antd';
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
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 16,
				gap: 12,
			}}
		>
			<Flex justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }} gap="small">
				<Typography.Text type="secondary" ellipsis title={currentPath ?? ''} style={{ fontSize: 13 }}>
					{currentPath ? getExplorerFileName(currentPath) : 'Откройте Markdown-файл'}
				</Typography.Text>
				<Button size="small" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Flex>

			<div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
				{!currentPath ? (
					<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography.Text type="secondary">
							Выберите файл .md через «Открыть…» или из проводника
						</Typography.Text>
					</div>
				) : contentQuery.isLoading ? (
					<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Spin size="small" />
					</div>
				) : contentQuery.isError ? (
					<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography.Text type="danger">Не удалось загрузить файл</Typography.Text>
					</div>
				) : (
					<div className={classes.markdownViewer} style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 24 }}>
						<ReactMarkdown remarkPlugins={remarkPlugins}>{markdown}</ReactMarkdown>
					</div>
				)}
			</div>
		</div>
	);
}
