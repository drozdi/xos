import { getAllSettings } from '@/core/api/endpoints/settings';
import type { UserSettingDto } from '@/types/api.types';

import { apiSettingsEnabled } from './createSettingAdapter';

export async function preloadSettings(): Promise<UserSettingDto[]> {
	if (!apiSettingsEnabled()) {
		return [];
	}

	return getAllSettings();
}
