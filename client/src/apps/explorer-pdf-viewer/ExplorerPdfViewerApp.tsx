import { ActionIcon, Box, Center, Group, Loader, Stack, Text, Tooltip } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import {
	getDocument,
	GlobalWorkerOptions,
	type PDFDocumentProxy,
	type PDFDocumentLoadingTask,
	type RenderTask,
} from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ExplorerPdfViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-pdf-viewer',
		fileTypes: ['document'],
		extensions: ['pdf'],
	});
	const url = useExplorerMediaUrl(currentPath);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
	const [page, setPage] = useState(1);
	const [pageCount, setPageCount] = useState(0);
	const [scale, setScale] = useState(1.1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'PDF');

	const showLoader = Boolean(currentPath) && !error && (loading || !url || !doc);

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

	useEffect(() => {
		if (!url) {
			setDoc(null);
			setPageCount(0);
			setPage(1);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);
		setDoc(null);
		setPageCount(0);
		setPage(1);

		// pdfjs-dist v6: getDocument only accepts DocumentInitParameters;
		// tear down via loadingTask.destroy() (PDFDocumentProxy.destroy was removed).
		const loadingTask: PDFDocumentLoadingTask = getDocument({ url });
		void loadingTask.promise
			.then((pdf) => {
				if (cancelled) {
					return;
				}
				setDoc(pdf);
				setPageCount(pdf.numPages);
				setPage(1);
			})
			.catch(() => {
				if (!cancelled) {
					setError('Не удалось открыть PDF');
					setDoc(null);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
			setDoc(null);
			void loadingTask.destroy().catch(() => {
				/* ignore teardown races */
			});
		};
	}, [url]);

	useEffect(() => {
		if (!doc || !canvasRef.current) {
			return;
		}
		let cancelled = false;
		let renderTask: RenderTask | null = null;
		void (async () => {
			try {
				const pdfPage = await doc.getPage(page);
				if (cancelled) {
					return;
				}
				const viewport = pdfPage.getViewport({ scale });
				const canvas = canvasRef.current;
				if (!canvas) {
					return;
				}
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				renderTask = pdfPage.render({ canvas, viewport });
				await renderTask.promise;
			} catch {
				// Cancelled / destroyed document — ignore.
			}
		})();
		return () => {
			cancelled = true;
			renderTask?.cancel();
		};
	}, [doc, page, scale]);

	return (
		<Stack h="100%" gap={0} style={{ minHeight: 0 }}>
			<Group
				px="md"
				py="xs"
				justify="space-between"
				style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
			>
				<Group gap={4}>
					<Tooltip label="Предыдущая">
						<ActionIcon
							variant="subtle"
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							aria-label="Предыдущая страница"
						>
							<IconChevronLeft size={18} />
						</ActionIcon>
					</Tooltip>
					<Text size="sm">
						{pageCount > 0 ? `${page} / ${pageCount}` : '—'}
					</Text>
					<Tooltip label="Следующая">
						<ActionIcon
							variant="subtle"
							disabled={page >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							aria-label="Следующая страница"
						>
							<IconChevronRight size={18} />
						</ActionIcon>
					</Tooltip>
				</Group>
				<Group gap={4}>
					<ActionIcon
						variant="subtle"
						onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
						aria-label="Уменьшить"
					>
						<IconZoomOut size={18} />
					</ActionIcon>
					<Text size="sm">{Math.round(scale * 100)}%</Text>
					<ActionIcon
						variant="subtle"
						onClick={() => setScale((s) => Math.min(3, Number((s + 0.1).toFixed(2))))}
						aria-label="Увеличить"
					>
						<IconZoomIn size={18} />
					</ActionIcon>
				</Group>
			</Group>
			<Box
				style={{
					flex: 1,
					minHeight: 0,
					overflow: 'auto',
					background: 'var(--mantine-color-gray-2)',
					position: 'relative',
				}}
			>
				{!currentPath ? (
					<Center h="100%" p="md">
						<Text c="dimmed">Файл → Открыть… или откройте PDF из Проводника</Text>
					</Center>
				) : (
					<>
						{showLoader || error ? (
							<Center
								style={{
									position: 'absolute',
									inset: 0,
									zIndex: 1,
									background: 'var(--mantine-color-gray-2)',
								}}
							>
								{error ? <Text c="red">{error}</Text> : <Loader size="sm" />}
							</Center>
						) : null}
						<Center p="md" style={{ visibility: showLoader || error ? 'hidden' : 'visible' }}>
							<canvas
								ref={canvasRef}
								style={{ maxWidth: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
							/>
						</Center>
					</>
				)}
			</Box>
		</Stack>
	);
}
