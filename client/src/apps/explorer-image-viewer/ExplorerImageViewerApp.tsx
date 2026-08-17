import { ActionIcon, Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconZoomIn, IconZoomOut, IconZoomReset } from '@tabler/icons-react';
import { useCallback, useEffect, useState, type WheelEvent } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

const MIN_ZOOM = 25;
const MAX_ZOOM = 400;
const ZOOM_STEP = 25;
const WHEEL_ZOOM_STEP = 10;

function clampZoom(value: number): number {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));
}

function fitScale(viewportW: number, viewportH: number, imageW: number, imageH: number): number {
	if (viewportW <= 0 || viewportH <= 0 || imageW <= 0 || imageH <= 0) {
		return 1;
	}
	return Math.min(viewportW / imageW, viewportH / imageH, 1);
}

export default function ExplorerImageViewerApp() {
	const { currentPath } = useExplorerSatelliteFile({
		appId: 'explorer-image-viewer',
		fileTypes: ['image'],
	});
	const url = useExplorerMediaUrl(currentPath);
	const { ref: viewportRef, width: viewportW, height: viewportH } = useElementSize();
	const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
	const [zoom, setZoom] = useState(100);

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Изображения');

	useEffect(() => {
		setZoom(100);
		setNaturalSize({ w: 0, h: 0 });
	}, [currentPath, url]);

	const zoomIn = useCallback(() => {
		setZoom((value) => clampZoom(value + ZOOM_STEP));
	}, []);

	const zoomOut = useCallback(() => {
		setZoom((value) => clampZoom(value - ZOOM_STEP));
	}, []);

	const resetZoom = useCallback(() => {
		setZoom(100);
	}, []);

	const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}
		event.preventDefault();
		const delta = event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP;
		setZoom((value) => clampZoom(value + delta));
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!event.ctrlKey && !event.metaKey) {
				return;
			}
			if (event.key === '=' || event.key === '+') {
				event.preventDefault();
				zoomIn();
			} else if (event.key === '-') {
				event.preventDefault();
				zoomOut();
			} else if (event.key === '0') {
				event.preventDefault();
				resetZoom();
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [zoomIn, zoomOut, resetZoom]);

	const baseScale = fitScale(viewportW, viewportH, naturalSize.w, naturalSize.h);
	const displayW = naturalSize.w > 0 ? naturalSize.w * baseScale * (zoom / 100) : undefined;
	const displayH = naturalSize.h > 0 ? naturalSize.h * baseScale * (zoom / 100) : undefined;

	return (
		<Stack h="100%" p="md" gap="sm" style={{ minHeight: 0 }}>
			<Group gap="xs" justify="space-between">
				<Text size="sm" c="dimmed">
					{url ? `${zoom}%` : '—'}
				</Text>
				<Group gap={4}>
					<Tooltip label="Уменьшить (Ctrl+-)">
						<ActionIcon variant="subtle" onClick={zoomOut} disabled={!url || zoom <= MIN_ZOOM} aria-label="Уменьшить">
							<IconZoomOut size={18} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Сбросить (Ctrl+0)">
						<ActionIcon variant="subtle" onClick={resetZoom} disabled={!url || zoom === 100} aria-label="Сбросить масштаб">
							<IconZoomReset size={18} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Увеличить (Ctrl+=)">
						<ActionIcon variant="subtle" onClick={zoomIn} disabled={!url || zoom >= MAX_ZOOM} aria-label="Увеличить">
							<IconZoomIn size={18} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>
			<Box
				ref={viewportRef}
				onWheel={handleWheel}
				style={{
					flex: 1,
					minHeight: 0,
					overflow: 'auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'var(--mantine-color-default-hover)',
					borderRadius: 'var(--mantine-radius-sm)',
				}}
			>
				{url ? (
					<img
						src={url}
						alt={currentPath ?? 'image'}
						draggable={false}
						onLoad={(event) => {
							const img = event.currentTarget;
							setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
						}}
						style={{
							display: 'block',
							width: displayW,
							height: displayH,
							maxWidth: 'none',
							maxHeight: 'none',
							flexShrink: 0,
						}}
					/>
				) : (
					<Text c="dimmed">Откройте изображение</Text>
				)}
			</Box>
		</Stack>
	);
}
