import { useAppManager } from '@/core/appManager/useAppManager';
import { useAppContext } from '@/core/context/AppContext';

export function useClassId(): number {
	const { instanceKey } = useAppContext();
	const id = Number.parseInt(instanceKey, 10);
	return Number.isNaN(id) ? 0 : id;
}

export function useEntityId(): number {
	return useClassId();
}

export function useLaunchSchooltaskApp() {
	const launchApp = useAppManager((state) => state.launchApp);

	return (appId: string, id: number, title?: string) => {
		void launchApp(appId, { instanceKey: String(id), title });
	};
}

export function createSchooltaskDetailManifestOptions(wmGroup: string, wmSort: number) {
	return {
		instanceKey: (params?: { instanceKey?: string; props?: Record<string, unknown> }) =>
			String(params?.instanceKey ?? params?.props?.classId ?? params?.props?.id ?? '0'),
		singleInstance: false as const,
		wmGroup,
		wmSort,
		startMenu: false as const,
		taskbarGroup: wmGroup,
		requiredRole: 'schooltask' as const,
		startMenuGroup: 'schooltask',
	};
}

export function createSchooltaskListManifestOptions(wmGroup: string, wmSort: number) {
	return {
		singleInstance: true as const,
		wmGroup,
		wmSort,
		startMenuSort: wmSort,
		startMenuGroup: 'schooltask',
		taskbarGroup: wmGroup,
		requiredRole: 'schooltask' as const,
	};
}

export function extractSubjectUserIds(users: { user_id: number }[] | undefined): number[] {
	return (users ?? []).map((item) => item.user_id).filter((id) => id > 0);
}

export function nextTempId(prefix = 'n'): string {
	return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}
