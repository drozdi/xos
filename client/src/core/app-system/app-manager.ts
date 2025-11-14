import { useAppManager } from './store';

export const appManager = {
	createRoot: useAppManager.getState().createRoot,
	register: useAppManager.getState().register,
	buildApp: useAppManager.getState().buildApp,
	createApp: useAppManager.getState().createApp,
	removeApp: useAppManager.getState().removeApp,
	reloadApps: useAppManager.getState().reloadApps,
	closeAll: useAppManager.getState().closeAll,
	unMountRoot: useAppManager.getState().unMountRoot,
	mountRoot: useAppManager.getState().mountRoot,
};
