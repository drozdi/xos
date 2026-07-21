import { useAppManager } from '@/core/appManager/useAppManager';
import { useAppContext } from '@/core/context/AppContext';

export function useEntityId(): number {
	const { instanceKey } = useAppContext();
	const id = Number.parseInt(instanceKey, 10);
	return Number.isNaN(id) ? 0 : id;
}

export function useLaunchMainApp() {
	const launchApp = useAppManager((state) => state.launchApp);

	return (appId: string, id: number) => {
		void launchApp(appId, { instanceKey: String(id) });
	};
}

export function createMainDetailManifestOptions(wmGroup: string, wmSort: number) {
	return {
		instanceKey: (params?: { instanceKey?: string; props?: Record<string, unknown> }) =>
			String(params?.instanceKey ?? params?.props?.id ?? '0'),
		singleInstance: false as const,
		wmGroup,
		wmSort,
		startMenu: false as const,
		taskbarGroup: wmGroup,
		requiredRole: 'main' as const,
	};
}

export function createMainListManifestOptions(wmGroup: string, wmSort: number) {
	return {
		singleInstance: true as const,
		wmGroup,
		wmSort,
		startMenuSort: wmSort,
		startMenuGroup: 'admin',
		taskbarGroup: wmGroup,
		requiredRole: 'main' as const,
	};
}
