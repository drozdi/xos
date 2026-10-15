import { userDataApi } from '@/core/api/endpoints/userData';

const PREFIX = 'inccom.table.';

function localPrefix(storageKey: string): string {
	return `${storageKey}.`;
}

export function collectInccomTablePrefs(storageKey: string): Record<string, unknown> {
	const prefix = localPrefix(storageKey);
	const out: Record<string, unknown> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key?.startsWith(prefix)) {
			continue;
		}
		const raw = localStorage.getItem(key);
		if (raw == null) {
			continue;
		}
		try {
			out[key.slice(prefix.length)] = JSON.parse(raw) as unknown;
		} catch {
			out[key.slice(prefix.length)] = raw;
		}
	}
	return out;
}

function applyBlob(storageKey: string, value: Record<string, unknown>): void {
	const prefix = localPrefix(storageKey);
	for (const [key, entry] of Object.entries(value)) {
		localStorage.setItem(prefix + key, JSON.stringify(entry));
	}
}

const uploadTimers = new Map<string, number>();

export function scheduleInccomTableUpload(storageKey: string): void {
	const prev = uploadTimers.get(storageKey);
	if (prev) {
		window.clearTimeout(prev);
	}
	uploadTimers.set(
		storageKey,
		window.setTimeout(() => {
			uploadTimers.delete(storageKey);
			void userDataApi.upsert({
				code: PREFIX + storageKey,
				value: collectInccomTablePrefs(storageKey),
			});
		}, 400),
	);
}

/** Pull server blobs into localStorage before IncCom tables mount. */
export async function ensureInccomTablePrefs(): Promise<void> {
	const items = await userDataApi.list(PREFIX);
	for (const item of items) {
		if (!item.code.startsWith(PREFIX) || !item.value || typeof item.value !== 'object') {
			continue;
		}
		applyBlob(item.code.slice(PREFIX.length), item.value as Record<string, unknown>);
	}
}
