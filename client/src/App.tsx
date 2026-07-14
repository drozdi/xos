import { Center, Loader, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { setupInterceptors } from '@/core/api/interceptors';
import { getAuthStoreActions, useAuthStore } from '@/core/auth/authStore';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { preloadSettings } from '@/core/settings/preloadSettings';
import { settingManager } from '@/core/settings/SettingManager';
import { theme } from '@/styles/theme';

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
	const hydrate = useAuthStore((state) => state.hydrate);
	const interceptorsReady = useRef(false);
	const [settingsReady, setSettingsReady] = useState(false);

	useEffect(() => {
		if (!interceptorsReady.current) {
			setupInterceptors(getAuthStoreActions());
			interceptorsReady.current = true;
		}

		void hydrate();
	}, [hydrate]);

	useEffect(() => {
		if (isLoading) {
			setSettingsReady(false);
			return;
		}

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
			setSettingsReady(true);
		}

		void bootstrapSettings();

		return () => {
			cancelled = true;
		};
	}, [isLoading, isAuthenticated]);

	const showLoader = isLoading || (isAuthenticated && !settingsReady);

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme}>
				<Notifications position="top-right" />
				{showLoader ? (
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
