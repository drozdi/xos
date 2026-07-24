import {
	FileOutlined,
	FileTextOutlined,
	FileZipOutlined,
	FolderOutlined,
	PictureOutlined,
	SoundOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { ComponentType } from 'react';

import type { ExplorerEntry } from './explorerApi';

export type ExplorerViewMode = 'table' | 'icons';

type ExplorerIconComponent = ComponentType<Partial<AntdIconProps>>;

export function isExplorerImageEntry(entry: ExplorerEntry): boolean {
	return entry.type === 'file' && entry.fileType === 'image';
}

export function getExplorerEntryIcon(entry: ExplorerEntry): ExplorerIconComponent {
	if (entry.type === 'folder') {
		return FolderOutlined;
	}

	switch (entry.fileType) {
		case 'image':
			return PictureOutlined;
		case 'video':
			return VideoCameraOutlined;
		case 'audio':
			return SoundOutlined;
		case 'archive':
			return FileZipOutlined;
		case 'text':
			return FileTextOutlined;
		case 'markdown':
			return FileTextOutlined;
		default:
			return FileOutlined;
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
