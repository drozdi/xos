import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { desktopStateApi } from '@/core/api/endpoints/desktopState';
import { registerAllApps } from '@/core/appManager';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';
import { useAuthStore } from '@/core/auth/authStore';
import * as tokenStorage from '@/core/auth/tokenStorage';

import { SchooltaskStandaloneRoutes } from '@/features/schooltask/standalone/routes';
import { SchooltaskStandaloneProvider } from '@/features/schooltask/standalone/schooltask-standalone';

function StandaloneRouterInner() {
	const navigate = useNavigate();
	return (
		<SchooltaskStandaloneProvider standalone navigate={navigate}>
			<SchooltaskStandaloneRoutes />
		</SchooltaskStandaloneProvider>
	);
}

/** Полноэкранный SchoolTask на /schooltask с входом по email. */
export default function SchooltaskStandaloneApp() {
	useEffect(() => {
		registerAllApps();
		document.title = 'Школа';

		let cancelled = false;
		async function boot() {
			settingManager.reset();
			await useAuthStore.getState().hydrate('app');
			if (cancelled) {
				return;
			}
			let preloadedSnapshot: Awaited<ReturnType<typeof desktopStateApi.load>> | undefined;
			let preloadFailed = false;
			if (useAuthStore.getState().isAuthenticated && useApiSettings()) {
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
			const adapter = await createSettingAdapter({ preloadedSnapshot, preloadFailed });
			if (cancelled) {
				return;
			}
			settingManager.init(adapter);
		}
		void boot();

		const onExpired = () => {
			void useAuthStore.getState();
			tokenStorage.clearTokens('app');
			useAuthStore.setState({
				user: null,
				scopes: {},
				isAuthenticated: false,
				isLoading: false,
			});
		};
		window.addEventListener('xos:app-session-expired', onExpired);
		return () => {
			cancelled = true;
			window.removeEventListener('xos:app-session-expired', onExpired);
		};
	}, []);

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				background: 'var(--xos-shell-bg, var(--mantine-color-body, #15171e))',
			}}
		>
			<BrowserRouter basename="/schooltask">
				<StandaloneRouterInner />
			</BrowserRouter>
		</div>
	);
}
