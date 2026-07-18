import { Box, Center, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { useExplorerMediaUrl } from '../useExplorerMediaUrl';
import { getExplorerEntryIcon, getExplorerEntryIconColor, isExplorerImageEntry } from '../explorerViewUtils';
import type { ExplorerEntry } from '../explorerApi';

interface ExplorerEntryThumbnailProps {
	entry: ExplorerEntry;
	path: string;
	size?: number;
}

export function ExplorerEntryThumbnail({ entry, path, size = 64 }: ExplorerEntryThumbnailProps) {
	const isImage = isExplorerImageEntry(entry);
	const containerRef = useRef<HTMLDivElement>(null);
	const [shouldLoad, setShouldLoad] = useState(!isImage);
	const imageUrl = useExplorerMediaUrl(isImage && shouldLoad ? path : null);
	const EntryIcon = getExplorerEntryIcon(entry);
	const iconColor = getExplorerEntryIconColor(entry);

	useEffect(() => {
		if (!isImage) {
			return undefined;
		}

		const element = containerRef.current;
		if (!element) {
			return undefined;
		}

		const observer = new IntersectionObserver(
			([observed]) => {
				if (observed?.isIntersecting) {
					setShouldLoad(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '120px' },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [isImage, path]);

	return (
		<Box
			ref={containerRef}
			w={size}
			h={size}
			style={{
				borderRadius: 6,
				overflow: 'hidden',
				background: 'var(--mantine-color-default-hover)',
				border: '1px solid var(--mantine-color-default-border)',
				flexShrink: 0,
			}}
		>
			{isImage && imageUrl ? (
				<img
					src={imageUrl}
					alt={entry.name}
					style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
				/>
			) : isImage && shouldLoad && !imageUrl ? (
				<Center h="100%">
					<Text size="xs" c="dimmed">
						…
					</Text>
				</Center>
			) : (
				<Center h="100%" c={iconColor}>
					<EntryIcon size={Math.round(size * 0.55)} stroke={1.5} />
				</Center>
			)}
		</Box>
	);
}
