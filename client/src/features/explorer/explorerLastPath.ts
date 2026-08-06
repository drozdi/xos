import axios from 'axios';
import { z } from 'zod';

import { fetchExplorerList } from './explorerApi';
import { normalizeExplorerFolderPath } from './explorerPathUtils';

/** ADR: `user_app_data` code for global last Explorer folder (charset `[a-z0-9._-]` only). */
export const EXPLORER_LAST_PATH_CODE = 'explorer.last_path';

export const EXPLORER_DEFAULT_PATH = 'home://';

const LOCAL_BUFFER_KEY = 'xos.explorer.lastPath';

/** Value shape: `{ "path": string }` — not a raw string. */
export const explorerLastPathValueSchema = z.object({
	path: z.string().min(1),
});

export type ExplorerLastPathValue = z.infer<typeof explorerLastPathValueSchema>;

export function isExplorerUriPath(path: string): boolean {
	return /^[a-z0-9_-]+:\/\//i.test(path.trim());
}

/** Parse KV value → normalized folder path, or null if invalid. */
export function parseExplorerLastPathValue(value: unknown): string | null {
	const parsed = explorerLastPathValueSchema.safeParse(value);
	if (!parsed.success) {
		return null;
	}
	const raw = parsed.data.path.trim();
	if (!raw || !isExplorerUriPath(raw)) {
		return null;
	}
	return normalizeExplorerFolderPath(raw);
}

export function toExplorerLastPathValue(path: string): ExplorerLastPathValue {
	return { path: normalizeExplorerFolderPath(path) };
}

export function readExplorerLastPathLocalBuffer(): string | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}
	try {
		const raw = localStorage.getItem(LOCAL_BUFFER_KEY);
		if (!raw) {
			return null;
		}
		return parseExplorerLastPathValue(JSON.parse(raw));
	} catch {
		return null;
	}
}

export function clearExplorerLastPathLocalBuffer(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	try {
		localStorage.removeItem(LOCAL_BUFFER_KEY);
	} catch {
		// ignore
	}
}

export function writeExplorerLastPathLocalBuffer(path: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	try {
		localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(toExplorerLastPathValue(path)));
	} catch {
		// quota / private mode — ignore
	}
}

function isPathDeniedStatus(status: number | undefined): boolean {
	return status === 400 || status === 403 || status === 404;
}

/** Probe VFS: deny/invalid → false; network/5xx → true (degraded keep). */
export async function isExplorerPathAccessible(path: string): Promise<boolean> {
	if (!isExplorerUriPath(path)) {
		return false;
	}
	try {
		await fetchExplorerList(path);
		return true;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (isPathDeniedStatus(error.response?.status)) {
				return false;
			}
			if (!error.response) {
				return true;
			}
		}
		return false;
	}
}

/**
 * Load stored last path from local cache.
 * Does not probe VFS — use {@link resolveExplorerLastPath} for hydrate.
 */
export async function loadStoredExplorerLastPath(): Promise<string | null> {
	return readExplorerLastPathLocalBuffer();
}

/**
 * Hydrate path for Explorer open: valid stored + accessible → path; else `home://`.
 */
export async function resolveExplorerLastPath(): Promise<string> {
	const stored = await loadStoredExplorerLastPath();
	if (!stored) {
		return EXPLORER_DEFAULT_PATH;
	}
	if (stored === EXPLORER_DEFAULT_PATH) {
		return EXPLORER_DEFAULT_PATH;
	}
	const ok = await isExplorerPathAccessible(stored);
	return ok ? stored : EXPLORER_DEFAULT_PATH;
}

export async function upsertExplorerLastPath(path: string): Promise<void> {
	const normalized = normalizeExplorerFolderPath(path);
	writeExplorerLastPathLocalBuffer(normalized);
}
