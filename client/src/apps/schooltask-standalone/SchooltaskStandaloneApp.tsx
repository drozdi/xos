import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { registerAllApps } from '@/core/appManager';
import { createSettingAdapter, useApiSettings } from '@/core/settings/createSettingAdapter';
import { preloadSettings } from '@/core/settings/preloadSettings';
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
			let preloaded;
			if (useAuthStore.getState().isAuthenticated && useApiSettings()) {
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
				background: 'var(--ant-color-bg-layout, #f5f5f5)',
			}}
		>
			<BrowserRouter basename="/schooltask">
				<StandaloneRouterInner />
			</BrowserRouter>
		</div>
	);
}
