import { notifications } from '@mantine/notifications';

import type { UserSettingDto } from '@/types/api.types';

import { ApiAdapter } from './adapters/ApiAdapter';
import { CompositeAdapter } from './adapters/CompositeAdapter';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
import type { ISettingAdapter } from './adapters/ISettingAdapter';

let apiErrorToastShown = false;

function useApiSettings(): boolean {
	return import.meta.env.VITE_USE_API_SETTINGS === 'true';
}

export interface CreateSettingAdapterOptions {
	preloaded?: UserSettingDto[];
}

async function seedLocalAdapter(
	local: LocalStorageAdapter,
	items: UserSettingDto[],
): Promise<void> {
	for (const item of items) {
		await local.set(item.category, item.key, item.value);
	}
}

export function createSettingAdapter(options: CreateSettingAdapterOptions = {}): ISettingAdapter {
	const local = new LocalStorageAdapter();

	if (!useApiSettings()) {
		return local;
	}

	const api = new ApiAdapter();
	if (options.preloaded?.length) {
		api.preload(options.preloaded);
		void seedLocalAdapter(local, options.preloaded);
	}

	return new CompositeAdapter(local, api, {
		useApi: true,
		onApiError: (error, operation) => {
			// eslint-disable-next-line no-console -- intentional degraded-mode warning
			console.warn(`[settings] API fallback for ${operation}:`, error);
			if (!apiErrorToastShown) {
				apiErrorToastShown = true;
				notifications.show({
					color: 'yellow',
					title: 'Настройки',
					message:
						'Не удалось синхронизировать настройки с сервером. Используется локальная копия.',
				});
			}
		},
	});
}

export function resetSettingAdapterState(): void {
	apiErrorToastShown = false;
}

export { useApiSettings };
