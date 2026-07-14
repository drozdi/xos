import { Box, Loader } from '@mantine/core';
import { memo, Suspense, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { AppProvider } from '@/core/context/AppContext';
import { CoreApiProvider } from '@/core/context/CoreApiContext';
import { createCoreApi } from '@/core/context/createCoreApi';

import { DemoWindowContent } from './DemoWindowContent';
import { Window } from './Window';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { useWmStore } from './useWmStore';
import type { WindowState } from './types';

const AppWindowContent = memo(({ window }: { window: WindowState }) => {
	const manifest = AppRegistry.get(window.appId);
	const coreApi = useMemo(
		() => createCoreApi(window.id, window.appId),
		[window.id, window.appId],
	);

	if (!manifest) {
		return <DemoWindowContent window={window} />;
	}

	const AppComponent = manifest.component;

	return (
		<CoreApiProvider coreApi={coreApi}>
			<AppProvider
				value={{
					appId: window.appId,
					windowId: window.id,
					instanceKey: window.instanceKey,
					manifest,
				}}
			>
				<Suspense
					fallback={
						<Box p="md">
							<Loader size="sm" />
						</Box>
					}
				>
					<AppComponent />
				</Suspense>
			</AppProvider>
		</CoreApiProvider>
	);
});

export function WindowManager() {
	const visibleWindows = useWmStore(
		useShallow((state) =>
			Object.values(state.windows).filter((window) => !window.minimized),
		),
	);

	const resetWindowContent = useCallback((windowId: string) => {
		const current = useWmStore.getState().windows[windowId];
		if (!current) {return;}
		useWmStore.getState().updateWindow(windowId, {
			contentKey: current.contentKey + 1,
		});
	}, []);

	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				pointerEvents: 'none',
			}}
		>
			{visibleWindows.map((window) => (
				<Box key={window.id} style={{ pointerEvents: 'auto' }}>
					<Window windowId={window.id}>
						<WindowErrorBoundary onReset={() => resetWindowContent(window.id)}>
							<AppWindowContent key={window.contentKey} window={window} />
						</WindowErrorBoundary>
					</Window>
				</Box>
			))}
		</Box>
	);
}
