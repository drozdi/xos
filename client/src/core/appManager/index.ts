export { AppRegistry } from './AppRegistry';
export { registerAllApps, manifests } from './registerApps';
export { useAppManager } from './useAppManager';
export {
	addToLaunchHistory,
	removeFromLaunchHistory,
	getLaunchHistory,
	saveLaunchHistory,
	restoreFromHistory,
} from './launchHistory';
export type { LaunchHistoryEntry } from './launchHistory';
export type { AppManifest, LaunchParams, RunningApp } from './types';
