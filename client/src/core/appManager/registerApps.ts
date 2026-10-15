import { AppRegistry } from './AppRegistry';
import type { AppManifest } from './types';
import { useAppManager } from './useAppManager';

const loaders = import.meta.glob<{ default?: AppManifest }>('../../apps/*/index.ts');

const manifests: AppManifest[] = [];
let loading: Promise<void> | null = null;

/** Manifest chunks load on demand; app components stay `lazy()` inside each index. */
export function registerAllApps(): Promise<void> {
	if (!loading) {
		loading = (async () => {
			const mods = await Promise.all(Object.values(loaders).map((load) => load()));
			manifests.length = 0;
			for (const mod of mods) {
				const manifest = mod.default;
				if (!manifest) {
					continue;
				}
				manifests.push(manifest);
				AppRegistry.register(manifest);
			}
			useAppManager.getState().registerApps(manifests);
		})();
	}
	return loading;
}

export { manifests };
