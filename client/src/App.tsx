import { Center, Loader, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { setupInterceptors } from '@/core/api/interceptors';
import { getAuthStoreActions, useAuthStore } from '@/core/auth/authStore';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { preloadSettings } from '@/core/settings/preloadSettings';
import { settingManager } from '@/core/settings/SettingManager';
import { DEFAULT_THEME, ThemeProvider, xosColorSchemeManager } from '@/core/theme';
import { theme } from '@/styles/theme';

const colorSchemeManager = xosColorSchemeManager();

const Desktop = lazy(() =>
	import('@/core/desktop/Desktop').then((module) => ({ default: module.Desktop })),
);

const LoginScreen = lazy(() =>
	import('@/core/auth/LoginScreen').then((module) => ({ default: module.LoginScreen })),
);

const queryClient = new QueryClient();

function AppShellFallback() {
	return (
		<Center h="100vh">
			<Loader size="lg" />
		</Center>
	);
}

export default function App() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);
	const interceptorsReady = useRef(false);
	const [settingsKey, setSettingsKey] = useState<'guest' | 'auth' | null>(null);

	useEffect(() => {
		if (!interceptorsReady.current) {
			setupInterceptors(getAuthStoreActions());
			interceptorsReady.current = true;
		}

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
	const settingsReady = settingsKey === expectedSettingsKey;

	const showLoader = isLoading || (isAuthenticated && !settingsReady);

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider
				theme={theme}
				defaultColorScheme={DEFAULT_THEME}
				colorSchemeManager={colorSchemeManager}
			>
				<Notifications position="top-right" />
				{settingsReady ? (
					<ThemeProvider>
						{showLoader ? (
							<AppShellFallback />
						) : (
							<Suspense fallback={<AppShellFallback />}>
								{isAuthenticated ? <Desktop /> : <LoginScreen />}
							</Suspense>
						)}
					</ThemeProvider>
				) : showLoader ? (
					<AppShellFallback />
				) : (
					<Suspense fallback={<AppShellFallback />}>
						{isAuthenticated ? <Desktop /> : <LoginScreen />}
					</Suspense>
				)}
			</MantineProvider>
		</QueryClientProvider>
	);
}
