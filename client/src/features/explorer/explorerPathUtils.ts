import type { ExplorerEntry } from './explorerApi';

export const EXPLORER_PARENT_ENTRY_ID = '__parent__';

export function parseExplorerDisk(path: string): string {
	const match = /^([a-z0-9_-]+):\/\//i.exec(path);
	return match?.[1]?.toLowerCase() ?? 'home';
}

/** Build `disk://relative/` (or `disk://` for root). */
export function joinExplorerDiskPath(diskOrRoot: string, relativePath = ''): string {
	const disk = parseExplorerDisk(
		diskOrRoot.includes('://') ? diskOrRoot : `${diskOrRoot}://`,
	);
	const relative = relativePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
	if (!relative || relative === '.') {
		return `${disk}://`;
	}
	return `${disk}://${relative}/`;
}

export function normalizeExplorerFolderPath(path: string): string {
	if (path.endsWith('://')) {
		return path;
	}
	return path.endsWith('/') ? path : `${path}/`;
}

export function getExplorerParentPath(path: string): string | null {
	const match = /^([a-z0-9_-]+):\/\/(.*)$/i.exec(path);
	if (!match) {
		return null;
	}

	const disk = (match[1] ?? 'home').toLowerCase();
	const rest = (match[2] ?? '').replace(/\/+$/, '');
	if (!rest) {
		return null;
	}

	const parts = rest.split('/').filter(Boolean);
	parts.pop();
	return parts.length > 0 ? `${disk}://${parts.join('/')}/` : `${disk}://`;
}

export function getExplorerFolderPath(path: string): string {
	if (path.endsWith('://')) {
		return path;
	}

	const normalized = path.replace(/\/+$/, '');
	const slash = normalized.lastIndexOf('/');
	if (slash < 0) {
		return 'home://';
	}

	const folder = normalized.slice(0, slash + 1);
	return folder.includes('://') ? folder : `${parseExplorerDisk(path)}://${folder}/`;
}

export function getExplorerFileName(path: string): string {
	const normalized = path.replace(/\/+$/, '');
	const slash = normalized.lastIndexOf('/');
	return slash >= 0 ? normalized.slice(slash + 1) : normalized;
}

export function joinExplorerPath(folder: string, fileName: string): string {
	const base = normalizeExplorerFolderPath(folder);
	const name = fileName.trim().replace(/^\/+/, '');
	if (!name) {
		return base;
	}
	return `${base}${name}`;
}

export function createExplorerParentEntry(parentPath: string): ExplorerEntry {
	return {
		path: parentPath,
		name: '..',
		relativePath: EXPLORER_PARENT_ENTRY_ID,
		type: 'folder',
		fileType: 'folder',
		extension: null,
		size: 0,
		modifiedAt: '',
		permissions: [],
	};
}

export function isExplorerParentEntry(entry: ExplorerEntry): boolean {
	return entry.relativePath === EXPLORER_PARENT_ENTRY_ID || entry.name === '..';
}
