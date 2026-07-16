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

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState, isLoading] = useSetState<ThemePreference>(
		'USER',
		THEME_SETTING_KEY,
		DEFAULT_THEME,
	);
	const { setColorScheme } = useMantineColorScheme();
	const hydratedRef = useRef(false);
	const userChangedRef = useRef(false);

	useEffect(() => {
		if (isLoading || hydratedRef.current || userChangedRef.current) {
			return;
		}

		hydratedRef.current = true;
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
