import { AppRegistry } from './AppRegistry';
import type { AppManifest } from './types';
import { useAppManager } from './useAppManager';

const modules = import.meta.glob('../../apps/*/index.ts', { eager: true });

const manifests: AppManifest[] = [];

for (const mod of Object.values(modules)) {
	const manifest = (mod as { default?: AppManifest }).default;
	if (manifest) {
		manifests.push(manifest);
		AppRegistry.register(manifest);
	}
}

export function registerAllApps(): void {
	useAppManager.getState().registerApps(manifests);
}

export { manifests };
