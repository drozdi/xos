import { isMantineColorScheme, type MantineColorSchemeManager } from '@mantine/core';

import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemePreference } from './types';

function readStoredTheme(defaultValue: ThemePreference = DEFAULT_THEME): ThemePreference {
	if (typeof window === 'undefined') {
		return defaultValue;
	}

	try {
		const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (raw === null) {
			return defaultValue;
		}

		const parsed = JSON.parse(raw) as unknown;
		return isMantineColorScheme(parsed) ? parsed : defaultValue;
	} catch {
		return defaultValue;
	}
}

export function xosColorSchemeManager(): MantineColorSchemeManager {
	let handleStorageEvent: ((event: StorageEvent) => void) | null = null;

	return {
		get: (defaultValue) => readStoredTheme(defaultValue ?? DEFAULT_THEME),
		set: (value) => {
			try {
				window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
			} catch (error) {
				console.warn('[xos] Unable to save color scheme.', error);
			}
		},
		subscribe: (onUpdate) => {
			handleStorageEvent = (event) => {
				if (event.storageArea !== window.localStorage || event.key !== THEME_STORAGE_KEY) {
					return;
				}

				if (event.newValue === null) {
					onUpdate(DEFAULT_THEME);
					return;
				}

				try {
					const parsed = JSON.parse(event.newValue) as unknown;
					if (isMantineColorScheme(parsed)) {
						onUpdate(parsed);
					}
				} catch {
					// ignore invalid values
				}
			};

			window.addEventListener('storage', handleStorageEvent);
		},
		unsubscribe: () => {
			if (handleStorageEvent) {
				window.removeEventListener('storage', handleStorageEvent);
			}
		},
		clear: () => {
			window.localStorage.removeItem(THEME_STORAGE_KEY);
		},
	};
}
