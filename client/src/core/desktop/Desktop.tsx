import { Box } from '@mantine/core';
import { useEffect, useRef } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { registerAllApps, useAppManager } from '@/core/appManager';
import { DesktopSurface } from '@/core/desktop/DesktopSurface';
import { Layout, LayoutArea } from '@/core/layout';
import {
	attachPageLifecycleListeners,
	registerUnloadFlush,
} from '@/core/lifecycle/pageLifecycle';
import { LocalRemindersWatcher } from '@/core/notifications/LocalRemindersWatcher';
import { DueNotifyWatcher } from '@/core/notifications';
import { getDesktopStatePersister } from '@/core/settings/desktopStatePersister';
import { Taskbar } from '@/core/taskbar';
import { flushPendingWindowPersists, persistAllOpenWindowsNow, WindowManager } from '@/core/windowManager';

/**
 * After auth + settings hydrate: restore open apps from APP.launchHistory + WIN geometry.
 * Same path for fresh login and returning session (token hydrate after browser reopen).
 */
export function Desktop() {
	const restoreFromHistory = useAppManager((state) => state.restoreFromHistory);
	const initializedRef = useRef(false);

	useEffect(() => {
		attachPageLifecycleListeners();
		const unregisterFlush = registerUnloadFlush(() => {
			// Latest geometry for all open windows + API flush (not only debounce timers)
			void persistAllOpenWindowsNow();
			void flushPendingWindowPersists();
			void getDesktopStatePersister().flush();
		});
		return unregisterFlush;
	}, []);

	useEffect(() => {
		if (initializedRef.current) {return;}
		initializedRef.current = true;

		registerAllApps();
		// Канон ADR: только restoreFromHistory (не restoreWindows)
		void restoreFromHistory();
	}, [restoreFromHistory]);

	return (
		<>
			<DueNotifyWatcher />
			<LocalRemindersWatcher />
			<Layout
				view={HKEY_CONFIG_DEFAULTS.layout.view}
				mobileView={HKEY_CONFIG_DEFAULTS.layout.mobileView}
			>
				<LayoutArea area="m">
					<Box style={{ position: 'absolute', inset: 0 }}>
						<DesktopSurface />
						<WindowManager />
					</Box>
				</LayoutArea>
				<LayoutArea area="f">
					<Taskbar />
				</LayoutArea>
			</Layout>
		</>
	);
}
