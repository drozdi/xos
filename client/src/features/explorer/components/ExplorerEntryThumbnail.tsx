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
		<div
			ref={containerRef}
			style={{
				width: size,
				height: size,
				borderRadius: 6,
				overflow: 'hidden',
				background: 'var(--xos-shell-hover)',
				border: '1px solid var(--xos-shell-border)',
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
				<div
					style={{
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'rgba(0,0,0,0.45)',
						fontSize: 12,
					}}
				>
					…
				</div>
			) : (
				<div
					style={{
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: iconColor,
					}}
				>
					<EntryIcon style={{ fontSize: Math.round(size * 0.55) }} />
				</div>
			)}
		</div>
	);
}
