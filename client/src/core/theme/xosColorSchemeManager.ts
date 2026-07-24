import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemePreference } from './types';

export function isThemePreference(value: unknown): value is ThemePreference {
	return value === 'light' || value === 'dark' || value === 'auto';
}

export function resolveColorScheme(preference: ThemePreference): 'light' | 'dark' {
	if (preference === 'light' || preference === 'dark') {
		return preference;
	}
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}
	return 'light';
}

/** Applies resolved light/dark to `<html>` via `data-theme` + class. */
export function applyDocumentTheme(preference: ThemePreference): void {
	if (typeof document === 'undefined') {
		return;
	}
	const resolved = resolveColorScheme(preference);
	const root = document.documentElement;
	root.setAttribute('data-theme', resolved);
	root.classList.toggle('dark', resolved === 'dark');
	root.classList.toggle('light', resolved === 'light');
	root.style.colorScheme = resolved;
}

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
		return isThemePreference(parsed) ? parsed : defaultValue;
	} catch {
		return defaultValue;
	}
}

export interface ColorSchemeManager {
	get: (defaultValue?: ThemePreference) => ThemePreference;
	set: (value: ThemePreference) => void;
	subscribe: (onUpdate: (value: ThemePreference) => void) => void;
	unsubscribe: () => void;
	clear: () => void;
}

/** localStorage-backed theme preference manager (no Mantine). */
export function xosColorSchemeManager(): ColorSchemeManager {
	let handleStorageEvent: ((event: StorageEvent) => void) | null = null;

	return {
		get: (defaultValue) => readStoredTheme(defaultValue ?? DEFAULT_THEME),
		set: (value) => {
			if (!isThemePreference(value)) {
				return;
			}
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
					if (isThemePreference(parsed)) {
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
