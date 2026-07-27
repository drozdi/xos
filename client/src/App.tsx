import { Flex, Spin } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

import { queryClient } from '@/core/api/queryClient';
import { setupInterceptors } from '@/core/api/interceptors';
import { getAuthStoreActions, useAuthStore } from '@/core/auth/authStore';
import { resolveStandaloneApp } from '@/core/auth/tokenStorage';
import { DatesSettingsProvider } from '@/core/dates';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { preloadSettings } from '@/core/settings/preloadSettings';
import { settingManager } from '@/core/settings/SettingManager';
import { ThemeProvider, useThemePreference } from '@/core/theme';
import { AntdProvider } from '@/ui/AntdProvider';

const Desktop = lazy(() =>
	import('@/core/desktop/Desktop').then((module) => ({ default: module.Desktop })),
);

const LoginScreen = lazy(() =>
	import('@/core/auth/LoginScreen').then((module) => ({ default: module.LoginScreen })),
);

const IncComStandaloneApp = lazy(() => import('@/apps/inccom/IncComStandaloneApp'));
const SchooltaskStandaloneApp = lazy(() => import('@/apps/schooltask-standalone/SchooltaskStandaloneApp'));

function AppShellFallback() {
	return (
		<Flex align="center" justify="center" style={{ height: '100vh' }}>
			<Spin size="large" />
		</Flex>
	);
}

function DesktopShell() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);
	const [settingsKey, setSettingsKey] = useState<'guest' | 'auth' | null>(null);

	useEffect(() => {
		void useAuthStore.getState().hydrate();
	}, []);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const targetKey = isAuthenticated ? 'auth' : 'guest';
		let cancelled = false;

		async function bootstrapSettings() {
			settingManager.reset();

			let preloaded;
			if (isAuthenticated && useApiSettings()) {
				try {
					preloaded = await preloadSettings();
				} catch {
					preloaded = undefined;
				}
			}

			if (cancelled) {
				return;
			}

			settingManager.init(createSettingAdapter({ preloaded }));
			setSettingsKey(targetKey);
		}

		void bootstrapSettings();

		return () => {
			cancelled = true;
		};
	}, [isLoading, isAuthenticated]);

	const expectedSettingsKey = isLoading ? null : isAuthenticated ? 'auth' : 'guest';
	const settingsReady =
		settingsKey !== null && expectedSettingsKey !== null && settingsKey === expectedSettingsKey;
	const showLoader = isLoading || !settingsReady;

	if (showLoader) {
		return <AppShellFallback />;
	}

	return (
		<Suspense fallback={<AppShellFallback />}>
			{isAuthenticated ? <Desktop /> : <LoginScreen />}
		</Suspense>
	);
}

function ThemedAntdBridge({ children }: { children: ReactNode }) {
	const { theme: colorScheme } = useThemePreference();
	return <AntdProvider colorScheme={colorScheme}>{children}</AntdProvider>;
}

function StandaloneShell() {
	const app = resolveStandaloneApp();
	if (app === 'schooltask') {
		return <SchooltaskStandaloneApp />;
	}
	return <IncComStandaloneApp />;
}

export default function App() {
	const interceptorsReady = useRef(false);
	const standaloneApp = resolveStandaloneApp();

	useEffect(() => {
		if (!interceptorsReady.current) {
			setupInterceptors(getAuthStoreActions());
			interceptorsReady.current = true;
		}
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<ThemedAntdBridge>
					<DatesSettingsProvider>
						{standaloneApp ? (
							<Suspense fallback={<AppShellFallback />}>
								<StandaloneShell />
							</Suspense>
						) : (
							<DesktopShell />
						)}
					</DatesSettingsProvider>
				</ThemedAntdBridge>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
