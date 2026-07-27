import { Box, Loader } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { memo, Suspense, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { AppShell } from '@/core/appMenu';
import { AppProvider } from '@/core/context/AppContext';
import { CoreApiProvider } from '@/core/context/CoreApiContext';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { DemoWindowContent } from './DemoWindowContent';
import { Window } from './Window';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { WindowManagerViewportContext } from './WindowManagerContext';
import { useWmStore } from './useWmStore';
import type { WindowState } from './types';

const AppWindowContent = memo(({ window }: { window: WindowState }) => {
	const manifest = AppRegistry.get(window.appId);
	const coreApi = getOrCreateCoreApi(window.id, window.appId);
	const appContextValue = useMemo(
		() =>
			manifest
				? {
						appId: window.appId,
						windowId: window.id,
						instanceKey: window.instanceKey,
						props: window.props,
						manifest,
					}
				: null,
		[manifest, window.appId, window.id, window.instanceKey, window.props],
	);

	if (!manifest || !appContextValue) {
		return <DemoWindowContent window={window} />;
	}

	const AppComponent = manifest.component;

	return (
		<CoreApiProvider coreApi={coreApi}>
			<AppProvider value={appContextValue}>
				<Suspense
					fallback={
						<Box p="md">
							<Loader size="sm" />
						</Box>
					}
				>
					<AppShell>
						<AppComponent />
					</AppShell>
				</Suspense>
			</AppProvider>
		</CoreApiProvider>
	);
});

export function WindowManager() {
	const { ref: containerRef, width, height } = useElementSize<HTMLDivElement>();
	const viewport = useMemo(
		() => ({ width: width ?? 0, height: height ?? 0 }),
		[width, height],
	);

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
		<WindowManagerViewportContext.Provider value={viewport}>
			<Box
				ref={containerRef}
				style={{
					position: 'absolute',
					inset: 0,
					pointerEvents: 'none',
				}}
			>
				{visibleWindows.map((window) => (
					<Window key={window.id} windowId={window.id}>
						<WindowErrorBoundary onReset={() => resetWindowContent(window.id)}>
							<AppWindowContent key={window.contentKey} window={window} />
						</WindowErrorBoundary>
					</Window>
				))}
			</Box>
		</WindowManagerViewportContext.Provider>
	);
}
