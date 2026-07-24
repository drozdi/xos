import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';

import { DEFAULT_THEME, type ThemePreference } from '@/core/theme/types';

const lightAlgorithm = antdTheme.defaultAlgorithm;
const darkAlgorithm = antdTheme.darkAlgorithm;

export function resolveAntdAlgorithm(preference: ThemePreference) {
	if (preference === 'dark') {
		return darkAlgorithm;
	}
	if (preference === 'light') {
		return lightAlgorithm;
	}
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return darkAlgorithm;
	}
	return lightAlgorithm;
}

interface AntdProviderProps {
	children: ReactNode;
	colorScheme?: ThemePreference;
}

/** Корневой провайдер Ant Design (локаль RU + тема). */
export function AntdProvider({ children, colorScheme = DEFAULT_THEME }: AntdProviderProps) {
	return (
		<ConfigProvider
			locale={ruRU}
			theme={{
				algorithm: resolveAntdAlgorithm(colorScheme),
				token: {
					colorPrimary: '#1677ff',
					borderRadius: 8,
					fontFamily: 'Inter, system-ui, sans-serif',
				},
			}}
		>
			<AntApp>{children}</AntApp>
		</ConfigProvider>
	);
}
