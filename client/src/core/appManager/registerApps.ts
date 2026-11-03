import { AppRegistry } from './AppRegistry';
import type { AppManifest } from './types';
import { useAppManager } from './useAppManager';

const loaders = import.meta.glob<{ default?: AppManifest }>('../../apps/*/index.ts');

const manifests: AppManifest[] = [];
let catalogLoading: Promise<void> | null = null;
const loaderById = new Map<string, () => Promise<{ default?: AppManifest }>>();

for (const [path, load] of Object.entries(loaders)) {
	const match = path.match(/apps\/([^/]+)\/index\.ts$/);
	if (match?.[1]) {
		loaderById.set(match[1], load);
	}
}

function registerLoadedManifest(manifest: AppManifest): void {
	AppRegistry.register(manifest);
	if (!manifests.some((item) => item.id === manifest.id)) {
		manifests.push(manifest);
	}
	useAppManager.getState().registerApps([manifest]);
}

/** One manifest chunk. The window component stays lazy inside that index. */
export async function loadAppManifest(appId: string): Promise<AppManifest | null> {
	const existing = AppRegistry.get(appId);
	if (existing) {
		return existing;
	}
	const load = loaderById.get(appId);
	if (!load) {
		return null;
	}
	const manifest = (await load()).default;
	if (!manifest) {
		return null;
	}
	registerLoadedManifest(manifest);
	return manifest;
}

/**
 * Load every app index (metadata only). Window bodies stay behind `React.lazy`
 * and are fetched when a window opens.
 */
export function registerAllApps(): Promise<void> {
	if (!catalogLoading) {
		catalogLoading = (async () => {
			await Promise.all([...loaderById.keys()].map((appId) => loadAppManifest(appId)));
		})();
	}
	return catalogLoading;
}

export { manifests };
