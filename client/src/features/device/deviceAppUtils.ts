import { useAppManager } from '@/core/appManager/useAppManager';
import { useAppContext } from '@/core/context/AppContext';

export function useEntityId(): number {
	const { instanceKey } = useAppContext();
	const id = Number.parseInt(instanceKey, 10);
	return Number.isNaN(id) ? 0 : id;
}

export function useLaunchDeviceApp() {
	const launchApp = useAppManager((state) => state.launchApp);

	return (appId: string, id: number) => {
		void launchApp(appId, { instanceKey: String(id) });
	};
}

export function createDeviceDetailManifestOptions(wmGroup: string, wmSort: number) {
	return {
		instanceKey: (params?: { instanceKey?: string; props?: Record<string, unknown> }) =>
			String(params?.instanceKey ?? params?.props?.id ?? '0'),
		singleInstance: false as const,
		wmGroup,
		wmSort,
		startMenu: false as const,
		taskbarGroup: wmGroup,
		requiredRole: 'device' as const,
		startMenuGroup: 'device',
	};
}

export function createDeviceListManifestOptions(wmGroup: string, wmSort: number) {
	return {
		singleInstance: true as const,
		wmGroup,
		wmSort,
		startMenuSort: wmSort,
		startMenuGroup: 'device',
		taskbarGroup: wmGroup,
		requiredRole: 'device' as const,
	};
}

export function normalizeIdRecord<T extends Record<string, unknown>>(
	value: unknown,
): Record<string, T> {
	if (value === null || value === undefined) {
		return {};
	}
	if (Array.isArray(value)) {
		const record: Record<string, T> = {};
		value.forEach((item, index) => {
			if (typeof item !== 'object' || item === null) {
				return;
			}
			const entry = item as Record<string, unknown>;
			const key = entry.id ?? index;
			record[String(key)] = item as T;
		});
		return record;
	}
	if (typeof value === 'object') {
		return value as Record<string, T>;
	}
	return {};
}

export function nextTempId(prefix = 'n'): string {
	return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}
