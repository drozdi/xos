import {
	IconFile,
	IconFileText,
	IconFileZip,
	IconFolder,
	IconMusic,
	IconPhoto,
	IconVideo,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

import type { ExplorerEntry } from './explorerApi';

export type ExplorerViewMode = 'table' | 'icons';

export function isExplorerImageEntry(entry: ExplorerEntry): boolean {
	return entry.type === 'file' && entry.fileType === 'image';
}

export function getExplorerEntryIcon(entry: ExplorerEntry): ComponentType<{ size?: number; stroke?: number }> {
	if (entry.type === 'folder') {
		return IconFolder;
	}

	switch (entry.fileType) {
		case 'image':
			return IconPhoto;
		case 'video':
			return IconVideo;
		case 'audio':
			return IconMusic;
		case 'archive':
			return IconFileZip;
		case 'text':
			return IconFileText;
		case 'markdown':
			return IconFileText;
		default:
			return IconFile;
	}
}

export function getExplorerEntryIconColor(entry: ExplorerEntry): string {
	if (entry.type === 'folder') {
		return 'var(--mantine-color-yellow-6)';
	}

	switch (entry.fileType) {
		case 'image':
			return 'var(--mantine-color-teal-6)';
		case 'video':
			return 'var(--mantine-color-violet-6)';
		case 'audio':
			return 'var(--mantine-color-pink-6)';
		case 'archive':
			return 'var(--mantine-color-orange-6)';
		case 'markdown':
			return 'var(--mantine-color-indigo-6)';
		case 'text':
			return 'var(--mantine-color-blue-6)';
		default:
			return 'var(--mantine-color-gray-6)';
	}
}
