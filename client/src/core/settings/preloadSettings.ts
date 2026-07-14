import { getAllSettings } from '@/core/api/endpoints/settings';
import type { UserSettingDto } from '@/types/api.types';

import { useApiSettings } from './createSettingAdapter';

export async function preloadSettings(): Promise<UserSettingDto[]> {
	if (!useApiSettings()) {
		return [];
	}

	return getAllSettings();
}
