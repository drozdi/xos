import { isMantineColorScheme, useMantineColorScheme } from '@mantine/core';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	type ReactNode,
} from 'react';

import { useSetState } from '@/core/settings/hooks';
import { settingManager } from '@/core/settings/SettingManager';

import { DEFAULT_THEME, THEME_SETTING_KEY, type ThemePreference } from './types';

interface ThemeContextValue {
	theme: ThemePreference;
	setTheme: (value: ThemePreference) => void;
	isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme SoT = SettingManager `USER.theme` после hydrate.
 * Mantine colorSchemeManager зеркалит тот же LS-ключ для bootstrap до init;
 * после load применяем тему из settings через setColorScheme **без** обратной
 * записи в SettingManager (иначе guest→auth / hydrate зациклит API writes).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState, isLoading] = useSetState<ThemePreference>(
		'USER',
		THEME_SETTING_KEY,
		DEFAULT_THEME,
	);
	const { setColorScheme } = useMantineColorScheme();
	const userChangedRef = useRef(false);

	// guest→auth / reset: сбросить «user changed», чтобы применить server SoT
	useEffect(() => {
		if (isLoading) {
			userChangedRef.current = false;
		}
	}, [isLoading]);

	useEffect(() => {
		if (isLoading || userChangedRef.current) {
			return;
		}
		// Только Mantine UI + LS mirror; SettingManager уже содержит SoT после hydrate
		setColorScheme(theme);
	}, [isLoading, theme, setColorScheme]);

	const setTheme = useCallback(
		(value: ThemePreference) => {
			if (!isMantineColorScheme(value)) {
				return;
			}

			userChangedRef.current = true;
			setColorScheme(value);
			setThemeState(value);

			if (settingManager.isInitialized()) {
				void settingManager.set('USER', THEME_SETTING_KEY, value);
			}
		},
		[setColorScheme, setThemeState],
	);

	return (
		<ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useThemePreference(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useThemePreference must be used within ThemeProvider');
	}
	return context;
}
