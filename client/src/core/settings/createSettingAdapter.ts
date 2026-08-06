import { notifications } from '@mantine/notifications';

import type { DesktopStateSnapshot } from '@/core/api/endpoints/desktopState';
import type { UserSettingDto } from '@/types/api.types';
import { clearExplorerLastPathLocalBuffer, writeExplorerLastPathLocalBuffer } from '@/features/explorer/explorerLastPath';

import { ApiAdapter } from './adapters/ApiAdapter';
import { CompositeAdapter } from './adapters/CompositeAdapter';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
import type { ISettingAdapter } from './adapters/ISettingAdapter';

let apiErrorToastShown = false;

function useApiSettings(): boolean {
	return import.meta.env.VITE_USE_API_SETTINGS === 'true';
}

export interface CreateSettingAdapterOptions {
	/** Успешный preload desktop snapshot. `undefined` — preload не выполнялся. */
	preloadedSnapshot?: DesktopStateSnapshot;
	/** Preload бросил ошибку: toast + local degraded, без clear LS. */
	preloadFailed?: boolean;
}

function showApiFallbackToast(): void {
	if (apiErrorToastShown) {
		return;
	}
	apiErrorToastShown = true;
	notifications.show({
		color: 'yellow',
		title: 'Настройки',
		message:
			'Не удалось синхронизировать настройки с сервером. Используется локальная копия.',
	});
}

async function clearThenSeedLocalAdapter(
	local: LocalStorageAdapter,
	items: UserSettingDto[],
): Promise<void> {
	local.clearAll();
	for (const item of items) {
		await local.set(item.category, item.key, item.value);
	}
}

async function clearThenSeedDesktopState(
	local: LocalStorageAdapter,
	snapshot: DesktopStateSnapshot,
): Promise<void> {
	await clearThenSeedLocalAdapter(local, snapshot.settings);
	if (snapshot.explorerLastPath) {
		writeExplorerLastPathLocalBuffer(snapshot.explorerLastPath.path);
	} else {
		clearExplorerLastPathLocalBuffer();
	}
}

/**
 * Создаёт adapter. При успешном preload: clear-then-seed local (await) и server-first Composite.
 * Barrier: вызывающий код должен `await` до `settingManager.init`.
 */
export async function createSettingAdapter(
	options: CreateSettingAdapterOptions = {},
): Promise<ISettingAdapter> {
	const local = new LocalStorageAdapter();

	if (!useApiSettings()) {
		return local;
	}

	if (options.preloadFailed) {
		showApiFallbackToast();
	}

	const api = new ApiAdapter();
	const hydrated = options.preloadedSnapshot !== undefined;

	if (hydrated) {
		api.preload(options.preloadedSnapshot.settings);
		await clearThenSeedDesktopState(local, options.preloadedSnapshot);
	}

	return new CompositeAdapter(local, api, {
		useApi: true,
		serverFirst: hydrated,
		onApiError: (error, operation) => {
			// eslint-disable-next-line no-console -- intentional degraded-mode warning
			console.warn(`[settings] API fallback for ${operation}:`, error);
			showApiFallbackToast();
		},
	});
}

export function resetSettingAdapterState(): void {
	apiErrorToastShown = false;
}

export { useApiSettings };
