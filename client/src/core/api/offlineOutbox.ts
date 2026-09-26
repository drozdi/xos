/**
 * Offline write outbox: queue POST/PUT/PATCH/DELETE when offline / network fail,
 * flush via apiClient on `online` and app start.
 */

import { notifications } from '@mantine/notifications';
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const LS_KEY = 'xos.api.outbox';
const IDB_NAME = 'xos-outbox';
const IDB_STORE = 'mutations';
const IDB_VERSION = 1;

export type OutboxItem = {
	id: string;
	path: string;
	method: string;
	body: string | null;
	headers: Record<string, string>;
	createdAt: number;
	/** Metadata-only: binary/FormData could not be queued */
	failed?: boolean;
	failReason?: string;
};

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

export function isMutatingMethod(method: string | undefined): boolean {
	return MUTATING.has((method ?? 'get').toLowerCase());
}

export function isAuthBypassPath(url: string | undefined): boolean {
	if (!url) {
		return false;
	}
	return (
		url.includes('/api/login') ||
		url.includes('/api/IncCom/auth/login') ||
		url.includes('/api/IncCom/auth/register') ||
		url.includes('/api/schooltask/auth/login') ||
		url.includes('/api/calendar/auth/login') ||
		url.includes('/api/token/refresh') ||
		url.includes('/api/IncCom/token/refresh') ||
		url.includes('/api/schooltask/token/refresh') ||
		url.includes('/api/calendar/token/refresh') ||
		url.includes('/api/logout') ||
		url.includes('/api/IncCom/auth/logout') ||
		url.includes('/api/schooltask/auth/logout') ||
		url.includes('/api/calendar/auth/logout')
	);
}

export function isUnqueueableBody(data: unknown): boolean {
	if (typeof FormData !== 'undefined' && data instanceof FormData) {
		return true;
	}
	if (typeof Blob !== 'undefined' && data instanceof Blob) {
		return true;
	}
	if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
		return true;
	}
	return false;
}

function serializeBody(data: unknown): string | null {
	if (data == null || data === '') {
		return null;
	}
	if (typeof data === 'string') {
		return data;
	}
	try {
		return JSON.stringify(data);
	} catch {
		return null;
	}
}

function pickSafeHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
	const headers: Record<string, string> = {};
	const raw = config.headers;
	if (!raw) {
		return headers;
	}
	const entries =
		typeof raw.toJSON === 'function'
			? Object.entries(raw.toJSON() as Record<string, unknown>)
			: Object.entries(raw as Record<string, unknown>);
	for (const [key, value] of entries) {
		const lower = key.toLowerCase();
		if (
			lower === 'authorization' ||
			lower === 'cookie' ||
			lower.includes('refresh') ||
			value == null
		) {
			continue;
		}
		headers[key] = String(value);
	}
	return headers;
}

function loadFromLocalStorage(): OutboxItem[] {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as OutboxItem[]) : [];
	} catch {
		return [];
	}
}

function saveToLocalStorage(items: OutboxItem[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function openIdb(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') {
		return Promise.resolve(null);
	}
	return new Promise((resolve) => {
		try {
			const req = indexedDB.open(IDB_NAME, IDB_VERSION);
			req.onerror = () => resolve(null);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(IDB_STORE)) {
					db.createObjectStore(IDB_STORE, { keyPath: 'id' });
				}
			};
			req.onsuccess = () => resolve(req.result);
		} catch {
			resolve(null);
		}
	});
}

async function idbGetAll(db: IDBDatabase): Promise<OutboxItem[]> {
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const store = tx.objectStore(IDB_STORE);
			const req = store.getAll();
			req.onsuccess = () => {
				const rows = Array.isArray(req.result) ? (req.result as OutboxItem[]) : [];
				resolve(rows.sort((a, b) => a.createdAt - b.createdAt));
			};
			req.onerror = () => resolve([]);
		} catch {
			resolve([]);
		}
	});
}

async function idbPut(db: IDBDatabase, item: OutboxItem): Promise<void> {
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).put(item);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		} catch {
			resolve();
		}
	});
}

async function idbDelete(db: IDBDatabase, id: string): Promise<void> {
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).delete(id);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		} catch {
			resolve();
		}
	});
}

export async function readOutbox(): Promise<OutboxItem[]> {
	const db = await openIdb();
	if (db) {
		const items = await idbGetAll(db);
		db.close();
		if (items.length > 0) {
			return items;
		}
	}
	return loadFromLocalStorage();
}

export async function enqueueOutboxItem(
	config: InternalAxiosRequestConfig,
	opts?: { failed?: boolean; failReason?: string },
): Promise<OutboxItem> {
	const item: OutboxItem = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		path: config.url ?? '',
		method: (config.method ?? 'post').toUpperCase(),
		body: opts?.failed ? null : serializeBody(config.data),
		headers: pickSafeHeaders(config),
		createdAt: Date.now(),
		failed: opts?.failed,
		failReason: opts?.failReason,
	};

	const db = await openIdb();
	if (db) {
		await idbPut(db, item);
		db.close();
	}
	const ls = loadFromLocalStorage();
	ls.push(item);
	saveToLocalStorage(ls);
	return item;
}

export async function removeOutboxItem(id: string): Promise<void> {
	const db = await openIdb();
	if (db) {
		await idbDelete(db, id);
		db.close();
	}
	saveToLocalStorage(loadFromLocalStorage().filter((row) => row.id !== id));
}

let flushing = false;

export async function flushOutbox(client: AxiosInstance): Promise<number> {
	if (flushing) {
		return 0;
	}
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		return 0;
	}
	flushing = true;
	let sent = 0;
	try {
		const items = (await readOutbox()).filter((item) => !item.failed);
		for (const item of items) {
			try {
				await client.request({
					url: item.path,
					method: item.method,
					data: item.body != null ? item.body : undefined,
					headers: {
						...item.headers,
						...(item.body != null && !item.headers['Content-Type']
							? { 'Content-Type': 'application/json' }
							: {}),
					},
					// Avoid re-queue loops while flushing
					_outboxFlush: true,
				} as InternalAxiosRequestConfig & { _outboxFlush?: boolean });
				await removeOutboxItem(item.id);
				sent += 1;
			} catch {
				// Stop on first failure; remaining stay queued
				break;
			}
		}
	} finally {
		flushing = false;
	}
	return sent;
}

let outboxInitialized = false;

export function initOfflineOutbox(client: AxiosInstance): void {
	if (outboxInitialized || typeof window === 'undefined') {
		return;
	}
	outboxInitialized = true;

	const runFlush = () => {
		void flushOutbox(client).then((count) => {
			if (count > 0) {
				notifications.show({
					color: 'teal',
					title: 'Offline-очередь',
					message: `Отправлено: ${count}`,
					autoClose: 3000,
				});
			}
		});
	};

	window.addEventListener('online', runFlush);
	runFlush();
}

export function createQueuedOfflineError(config: InternalAxiosRequestConfig): AxiosError {
	return new axios.AxiosError(
		'Запрос сохранён в offline-очередь',
		'ERR_OFFLINE_QUEUED',
		config,
	);
}
