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
import {
	applyDocumentTheme,
	isThemePreference,
	xosColorSchemeManager,
} from './xosColorSchemeManager';

interface ThemeContextValue {
	theme: ThemePreference;
	setTheme: (value: ThemePreference) => void;
	isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const colorSchemeManager = xosColorSchemeManager();

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState, isLoading] = useSetState<ThemePreference>(
		'USER',
		THEME_SETTING_KEY,
		colorSchemeManager.get(DEFAULT_THEME),
	);
	const hydratedRef = useRef(false);
	const userChangedRef = useRef(false);

	useEffect(() => {
		applyDocumentTheme(theme);
	}, [theme]);

	useEffect(() => {
		if (theme !== 'auto' || typeof window === 'undefined') {
			return undefined;
		}
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => applyDocumentTheme('auto');
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	}, [theme]);

	useEffect(() => {
		if (isLoading || hydratedRef.current || userChangedRef.current) {
			return;
		}

		hydratedRef.current = true;
		colorSchemeManager.set(theme);
		applyDocumentTheme(theme);
	}, [isLoading, theme]);

	useEffect(() => {
		const onStorageUpdate = (value: ThemePreference) => {
			if (userChangedRef.current) {
				return;
			}
			setThemeState(value);
			applyDocumentTheme(value);
		};
		colorSchemeManager.subscribe(onStorageUpdate);
		return () => colorSchemeManager.unsubscribe();
	}, [setThemeState]);

	const setTheme = useCallback(
		(value: ThemePreference) => {
			if (!isThemePreference(value)) {
				return;
			}

			userChangedRef.current = true;
			applyDocumentTheme(value);
			colorSchemeManager.set(value);
			setThemeState(value);

			if (settingManager.isInitialized()) {
				void settingManager.set('USER', THEME_SETTING_KEY, value);
			}
		},
		[setThemeState],
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
