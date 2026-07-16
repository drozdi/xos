import { create } from 'zustand';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

import { removePersistedWindow, schedulePersistWindow } from './persistWindow';
import type { OpenWindowPayload, WindowState } from './types';

const BASE_Z_INDEX = 100;

interface WmStore {
	windows: Record<string, WindowState>;
	activeWindowId: string | null;
	nextZIndex: number;
	openWindow: (payload: OpenWindowPayload) => string;
	closeWindow: (id: string) => void;
	focusWindow: (id: string) => void;
	updateWindow: (id: string, patch: Partial<WindowState>) => void;
	minimizeWindow: (id: string) => void;
	maximizeWindow: (id: string, bounds: { x: number; y: number; width: number; height: number }) => void;
	restoreWindow: (id: string) => void;
	getWindowsByGroup: (wmGroup: string) => WindowState[];
	minimizeGroup: (wmGroup: string) => void;
	restoreGroup: (wmGroup: string) => void;
}

function createWindowId(appId: string, instanceKey: string, id?: string): string {
	return id ?? `${appId}__${instanceKey}`;
}

function shouldPersist(patch: Partial<WindowState>): boolean {
	return Object.keys(patch).some((key) => key !== 'zIndex' && key !== 'contentKey');
}

function defaultWindowBounds(): Pick<WindowState, 'x' | 'y' | 'width' | 'height'> {
	const { defaultWidth, defaultHeight } = HKEY_CONFIG_DEFAULTS.window;
	const offset = Object.keys(useWmStore.getState().windows).length * 24;
	return {
		x: 80 + offset,
		y: 60 + offset,
		width: defaultWidth,
		height: defaultHeight,
	};
}

export const useWmStore = create<WmStore>((set, get) => ({
	windows: {},
	activeWindowId: null,
	nextZIndex: BASE_Z_INDEX,

	openWindow: (payload) => {
		const id = createWindowId(payload.appId, payload.instanceKey, payload.id);
		const defaults = defaultWindowBounds();
		const zIndex = get().nextZIndex;

		const windowState: WindowState = {
			id,
			appId: payload.appId,
			instanceKey: payload.instanceKey,
			title: payload.title,
			x: payload.x ?? defaults.x,
			y: payload.y ?? defaults.y,
			width: payload.width ?? defaults.width,
			height: payload.height ?? defaults.height,
			zIndex,
			minimized: payload.minimized ?? false,
			maximized: payload.maximized ?? false,
			wmGroup: payload.wmGroup ?? 'default',
			wmSort: payload.wmSort ?? 0,
			contentKey: 0,
		};

		if (windowState.maximized) {
			windowState.preMaximize = {
				x: windowState.x,
				y: windowState.y,
				width: windowState.width,
				height: windowState.height,
			};
		}

		set((state) => ({
			windows: { ...state.windows, [id]: windowState },
			activeWindowId: id,
			nextZIndex: state.nextZIndex + 1,
		}));

		schedulePersistWindow(id);
		return id;
	},

	closeWindow: (id) => {
		const removed = get().windows[id];
		if (!removed) {return;}

		set((state) => {
			const { [id]: _closed, ...rest } = state.windows;
			const windowIds = Object.keys(rest);
			const activeWindowId =
				state.activeWindowId === id
					? (windowIds[windowIds.length - 1] ?? null)
					: state.activeWindowId;

			return { windows: rest, activeWindowId };
		});

		void removePersistedWindow(id, removed.appId);
	},

	focusWindow: (id) => {
		const windowState = get().windows[id];
		if (!windowState || get().activeWindowId === id) {return;}

		const zIndex = get().nextZIndex;
		set((state) => ({
			activeWindowId: id,
			nextZIndex: state.nextZIndex + 1,
			windows: {
				...state.windows,
				[id]: { ...windowState, zIndex, minimized: false },
			},
		}));
	},

	updateWindow: (id, patch) => {
		const current = get().windows[id];
		if (!current) {return;}

		const hasChanges = Object.entries(patch).some(
			([key, value]) => current[key as keyof WindowState] !== value,
		);
		if (!hasChanges) {return;}

		set((state) => ({
			windows: {
				...state.windows,
				[id]: { ...current, ...patch },
			},
		}));

		if (shouldPersist(patch)) {
			schedulePersistWindow(id);
		}
	},

	minimizeWindow: (id) => {
		get().updateWindow(id, { minimized: true });
	},

	maximizeWindow: (id, bounds) => {
		const current = get().windows[id];
		if (!current || current.maximized) {return;}

		set((state) => ({
			windows: {
				...state.windows,
				[id]: {
					...current,
					preMaximize: {
						x: current.x,
						y: current.y,
						width: current.width,
						height: current.height,
					},
					x: bounds.x,
					y: bounds.y,
					width: bounds.width,
					height: bounds.height,
					maximized: true,
				},
			},
		}));

		schedulePersistWindow(id);
	},

	restoreWindow: (id) => {
		const current = get().windows[id];
		if (!current) {return;}

		if (current.maximized && current.preMaximize) {
			set((state) => ({
				windows: {
					...state.windows,
					[id]: {
						...current,
						x: current.preMaximize!.x,
						y: current.preMaximize!.y,
						width: current.preMaximize!.width,
						height: current.preMaximize!.height,
						maximized: false,
						minimized: false,
						preMaximize: undefined,
					},
				},
			}));
			schedulePersistWindow(id);
			return;
		}

		get().updateWindow(id, { minimized: false });
	},

	getWindowsByGroup: (wmGroup) => {
		return Object.values(get().windows).filter((window) => window.wmGroup === wmGroup);
	},

	minimizeGroup: (wmGroup) => {
		for (const window of get().getWindowsByGroup(wmGroup)) {
			if (!window.minimized) {
				get().minimizeWindow(window.id);
			}
		}
	},

	restoreGroup: (wmGroup) => {
		const groupWindows = get().getWindowsByGroup(wmGroup);
		const minimized = groupWindows.filter((window) => window.minimized);
		if (minimized.length === 0) {return;}

		const activeId = get().activeWindowId;
		if (activeId && minimized.some((window) => window.id === activeId)) {
			get().restoreWindow(activeId);
			get().focusWindow(activeId);
			return;
		}

		const target = [...minimized].sort(
			(a, b) => b.wmSort - a.wmSort || b.zIndex - a.zIndex,
		)[0];

		if (!target) {return;}

		get().restoreWindow(target.id);
		get().focusWindow(target.id);
	},
}));
