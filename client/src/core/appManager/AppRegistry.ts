import { checkHasScope } from '@/core/auth/coreScopes';
import { canAccessApp, hasFullAppAccess } from '@/core/auth/coreRoles';

import type { AppManifest } from './types';

const registry = new Map<string, AppManifest>();

export const AppRegistry = {
	register(manifest: AppManifest): void {
		registry.set(manifest.id, manifest);
	},

	get(appId: string): AppManifest | undefined {
		return registry.get(appId);
	},

	getAll(): AppManifest[] {
		return Array.from(registry.values());
	},

	getAllMap(): Map<string, AppManifest> {
		return new Map(registry);
	},

	getAvailable(): AppManifest[] {
		return AppRegistry.getAll().filter((manifest) => AppRegistry.canAccess(manifest));
	},

	canAccess(manifest: AppManifest): boolean {
		if (manifest.requiredRole && !canAccessApp(manifest.requiredRole)) {
			return false;
		}
		if (
			manifest.requiredScope &&
			!(manifest.requiredRole && hasFullAppAccess(manifest.requiredRole)) &&
			!checkHasScope(manifest.requiredScope, manifest.requiredRole)
		) {
			return false;
		}
		return true;
	},

	clear(): void {
		registry.clear();
	},
};
