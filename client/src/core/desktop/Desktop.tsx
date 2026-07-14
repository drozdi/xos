import { Text } from '@mantine/core';
import { useEffect, useRef } from 'react';

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
		<Layout>
			<LayoutArea area="h">
				<Text fw={600} size="sm" p="sm" c="gray.3">
					XOS
				</Text>
			</LayoutArea>
			<LayoutArea area="l" />
			<LayoutArea area="m">
				<WindowManager />
			</LayoutArea>
			<LayoutArea area="r" />
			<LayoutArea area="f">
				<Taskbar />
			</LayoutArea>
		</Layout>
	);
}
