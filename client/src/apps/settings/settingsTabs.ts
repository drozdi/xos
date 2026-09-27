export const SETTINGS_TABS = ['profile', 'date', 'shell', 'ou', 'widgets'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export function resolveSettingsTab(raw: unknown): SettingsTab {
	if (typeof raw === 'string' && (SETTINGS_TABS as readonly string[]).includes(raw)) {
		return raw as SettingsTab;
	}
	return 'profile';
}
