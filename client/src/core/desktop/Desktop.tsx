import { useEffect, useRef } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { registerAllApps, useAppManager } from '@/core/appManager';
import { Layout, LayoutArea } from '@/core/layout';
import { Taskbar } from '@/core/taskbar';
import { WindowManager } from '@/core/windowManager';

export function Desktop() {
	const restoreFromHistory = useAppManager((state) => state.restoreFromHistory);
	const initializedRef = useRef(false);

	useEffect(() => {
		if (initializedRef.current) {return;}
		initializedRef.current = true;

		registerAllApps();
		void restoreFromHistory();
	}, [restoreFromHistory]);

	return (
		<Layout
			view={HKEY_CONFIG_DEFAULTS.layout.view}
			mobileView={HKEY_CONFIG_DEFAULTS.layout.mobileView}
		>
			<LayoutArea area="m">
				<WindowManager />
			</LayoutArea>
			<LayoutArea area="f">
				<Taskbar />
			</LayoutArea>
		</Layout>
	);
}
