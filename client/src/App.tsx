import { Center, Loader, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { desktopStateApi } from '@/core/api/endpoints/desktopState';
import { queryClient } from '@/core/api/queryClient';
import { setupInterceptors } from '@/core/api/interceptors';
import { getAuthStoreActions, useAuthStore } from '@/core/auth/authStore';
import { resolveStandaloneApp } from '@/core/auth/tokenStorage';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';
import { battleNetCssVariablesResolver } from '@/core/theme/battleNetTheme';
import { DEFAULT_THEME, ThemeProvider, xosColorSchemeManager } from '@/core/theme';
import { DatesSettingsProvider } from '@/core/dates';
import { theme } from '@/styles/theme';

const colorSchemeManager = xosColorSchemeManager();

const Desktop = lazy(() =>
	import('@/core/desktop/Desktop').then((module) => ({ default: module.Desktop })),
);

const LoginScreen = lazy(() =>
	import('@/core/auth/LoginScreen').then((module) => ({ default: module.LoginScreen })),
);

const IncComStandaloneApp = lazy(() => import('@/apps/inccom/IncComStandaloneApp'));
const SchooltaskStandaloneApp = lazy(() => import('@/apps/schooltask-standalone/SchooltaskStandaloneApp'));
const CalendarStandaloneApp = lazy(() => import('@/apps/calendar-standalone/CalendarStandaloneApp'));

function AppShellFallback() {
	return (
		<Center h="100vh">
			<Loader size="lg" />
		</Center>
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

			let preloadedSnapshot: Awaited<ReturnType<typeof desktopStateApi.load>> | undefined;
			let preloadFailed = false;
			if (isAuthenticated && useApiSettings()) {
				try {
					preloadedSnapshot = await desktopStateApi.load();
				} catch {
					preloadedSnapshot = undefined;
					preloadFailed = true;
				}
			}

			if (cancelled) {
				return;
			}

			// Barrier: await clear-then-seed до init / UI shell restore
			const adapter = await createSettingAdapter({ preloadedSnapshot, preloadFailed });
			if (cancelled) {
				return;
			}
			settingManager.init(adapter);
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

function StandaloneShell() {
	const app = resolveStandaloneApp();
	if (app === 'schooltask') {
		return <SchooltaskStandaloneApp />;
	}
	if (app === 'calendar') {
		return <CalendarStandaloneApp />;
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
			<MantineProvider
				theme={theme}
				defaultColorScheme={DEFAULT_THEME}
				colorSchemeManager={colorSchemeManager}
				cssVariablesResolver={battleNetCssVariablesResolver}
			>
				<ModalsProvider>
					<Notifications position="top-right" />
					<ThemeProvider>
						<DatesSettingsProvider>
							{standaloneApp ? (
								<Suspense fallback={<AppShellFallback />}>
									<StandaloneShell />
								</Suspense>
							) : (
								<DesktopShell />
							)}
						</DatesSettingsProvider>
					</ThemeProvider>
				</ModalsProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
