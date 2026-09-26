import { useAppManager } from '@/core/appManager/useAppManager';
import { useAppContext } from '@/core/context/AppContext';

export function useEntityId(): number {
	const { instanceKey } = useAppContext();
	const id = Number.parseInt(instanceKey, 10);
	return Number.isNaN(id) ? 0 : id;
}

export function useLaunchAssetsApp() {
	const launchApp = useAppManager((state) => state.launchApp);

	return (appId: string, id: number, props?: Record<string, unknown>) => {
		void launchApp(appId, { instanceKey: String(id), props });
	};
}

export function createAssetsDetailManifestOptions(wmGroup: string, wmSort: number) {
	return {
		instanceKey: (params?: { instanceKey?: string; props?: Record<string, unknown> }) =>
			String(params?.instanceKey ?? params?.props?.id ?? '0'),
		singleInstance: false as const,
		wmGroup,
		wmSort,
		startMenu: false as const,
		taskbarGroup: wmGroup,
		requiredRole: 'assets' as const,
		startMenuGroup: 'assets',
	};
}

export function createAssetsListManifestOptions(wmGroup: string, wmSort: number) {
	return {
		singleInstance: true as const,
		wmGroup,
		wmSort,
		startMenuSort: wmSort,
		startMenuGroup: 'assets',
		taskbarGroup: wmGroup,
		requiredRole: 'assets' as const,
	};
}
