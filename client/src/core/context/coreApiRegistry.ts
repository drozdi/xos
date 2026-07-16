import { createCoreApi } from './createCoreApi';
import type { CoreApi } from './types';

const registry = new Map<string, CoreApi>();

export function getOrCreateCoreApi(windowId: string, appId: string): CoreApi {
	const existing = registry.get(windowId);
	if (existing && existing.appId === appId) {
		return existing;
	}

	const api = createCoreApi(windowId, appId);
	registry.set(windowId, api);
	return api;
}

export function destroyCoreApi(windowId: string): void {
	registry.delete(windowId);
}
