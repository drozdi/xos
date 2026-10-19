import { Box, Loader } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { memo, Suspense, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { AppShell } from '@/core/appMenu';
import { AppProvider } from '@/core/context/AppContext';
import { CoreApiProvider } from '@/core/context/CoreApiContext';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';
import { WidgetSkeleton } from '@/core/desktop/WidgetSurface';

import { DemoWindowContent } from './DemoWindowContent';
import { Window } from './Window';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { WindowManagerViewportContext } from './WindowManagerContext';
import { useWmStore } from './useWmStore';
import { selectContentWindow, selectVisibleWindowIds, type ContentWindow } from './windowSelectors';

const AppWindowContent = memo(({ window }: { window: ContentWindow }) => {
	const manifest = AppRegistry.get(window.appId);
	const coreApi = getOrCreateCoreApi(window.id, window.appId);
	const isWidget = (window.shellRole ?? manifest?.shellRole) === 'widget';
	const appContextValue = useMemo(
		() =>
			manifest
				? {
						appId: window.appId,
						windowId: window.id,
						instanceKey: window.instanceKey,
						props: {
							...window.props,
							...(window.widgetSettingsTick != null
								? { __widgetSettingsTick: window.widgetSettingsTick }
								: {}),
						},
						manifest,
					}
				: null,
		[
			manifest,
			window.appId,
			window.id,
			window.instanceKey,
			window.props,
			window.widgetSettingsTick,
		],
	);

	if (!manifest || !appContextValue) {
		return <DemoWindowContent window={window} />;
	}

	const AppComponent = manifest.component;

	const fallback = isWidget ? (
		<WidgetSkeleton compact={window.compact} />
	) : (
		<Box p="md">
			<Loader size="sm" />
		</Box>
	);

	return (
		<CoreApiProvider coreApi={coreApi}>
			<AppProvider value={appContextValue}>
				<Suspense fallback={fallback}>
					{/* Widgets skip AppShell: absolute inset collapses until interaction. */}
					{isWidget ? (
						<Box h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
							<AppComponent />
						</Box>
					) : (
						<AppShell>
							<AppComponent />
						</AppShell>
					)}
				</Suspense>
			</AppProvider>
		</CoreApiProvider>
	);
});

function resetWindowContent(windowId: string) {
	const current = useWmStore.getState().windows[windowId];
	if (!current) {return;}
	useWmStore.getState().updateWindow(windowId, {
		contentKey: current.contentKey + 1,
	});
}

const WindowSlot = memo(({ windowId }: { windowId: string }) => {
	const content = useWmStore(useShallow((state) => selectContentWindow(state.windows[windowId])));
	const handleReset = useCallback(() => resetWindowContent(windowId), [windowId]);

	if (!content) {
		return null;
	}

	return (
		<Window windowId={windowId}>
			<WindowErrorBoundary onReset={handleReset}>
				<AppWindowContent key={content.contentKey} window={content} />
			</WindowErrorBoundary>
		</Window>
	);
});

export function WindowManager() {
	const { ref: containerRef, width, height } = useElementSize<HTMLDivElement>();
	const roundedWidth = Math.round(width ?? 0);
	const roundedHeight = Math.round(height ?? 0);
	const viewport = useMemo(
		() => ({ width: roundedWidth, height: roundedHeight }),
		[roundedWidth, roundedHeight],
	);

	const visibleWindowIds = useWmStore(useShallow(selectVisibleWindowIds));

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
				{visibleWindowIds.map((windowId) => (
					<WindowSlot key={windowId} windowId={windowId} />
				))}
			</Box>
		</WindowManagerViewportContext.Provider>
	);
}
