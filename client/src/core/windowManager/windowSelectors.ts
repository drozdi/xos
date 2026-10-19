import type { WindowState } from './types';

interface WindowsSlice {
	windows: Record<string, WindowState>;
}

/** Ids of non-minimized windows; stable under focus/geometry changes when compared shallowly. */
export function selectVisibleWindowIds(state: WindowsSlice): string[] {
	return Object.values(state.windows)
		.filter((window) => !window.minimized)
		.map((window) => window.id);
}

/** Content props that change what the app renders; geometry and zIndex are excluded. */
export function selectContentWindow(window: WindowState | undefined) {
	if (!window) {
		return undefined;
	}
	return {
		id: window.id,
		appId: window.appId,
		instanceKey: window.instanceKey,
		props: window.props,
		widgetSettingsTick: window.widgetSettingsTick,
		shellRole: window.shellRole,
		title: window.title,
		contentKey: window.contentKey,
		compact: window.height < 90,
	};
}

export type ContentWindow = NonNullable<ReturnType<typeof selectContentWindow>>;

/** Fields the taskbar renders; geometry and zIndex changes must not re-render it. */
export function selectTaskbarSignature(state: WindowsSlice): string {
	return Object.values(state.windows)
		.map(
			(w) =>
				`${w.id}\u0001${w.appId}\u0001${w.title}\u0001${w.taskbarGroup}\u0001${w.wmSort}\u0001${w.minimized ? 1 : 0}\u0001${w.maximized ? 1 : 0}\u0001${w.shellRole}\u0001${w.instanceKey}`,
		)
		.join('\u0002');
}
