import { create } from 'zustand';

import { useAppManager } from '@/core/appManager/useAppManager';
import { useWmStore } from '@/core/windowManager/useWmStore';

export type ExplorerPickerMode = 'open' | 'save';

export const EXPLORER_OPEN_PICKER_APP_ID = 'explorer-open-picker';
export const EXPLORER_SAVE_PICKER_APP_ID = 'explorer-save-picker';

export interface ExplorerPickerRequest {
	id: string;
	mode: ExplorerPickerMode;
	consumerAppId: string;
	fileTypes?: string[];
	extensions?: string[];
	initialPath?: string;
	defaultFileName?: string;
	title?: string;
	pickerWindowId?: string;
}

interface CancelPickerOptions {
	/** When true, only clear active (WM close already in progress). */
	skipClose?: boolean;
}

interface ExplorerPickerStore {
	active: ExplorerPickerRequest | null;
	pendingResults: Record<string, string>;
	startPicker: (request: Omit<ExplorerPickerRequest, 'id'>) => ExplorerPickerRequest;
	setPickerWindowId: (windowId: string) => void;
	cancelPicker: (options?: CancelPickerOptions) => void;
	completePicker: (path: string) => void;
	takeResult: (consumerAppId: string) => string | null;
}

function closePickerWindow(windowId: string | undefined): void {
	if (!windowId) {
		return;
	}
	if (!useWmStore.getState().windows[windowId]) {
		return;
	}
	useWmStore.getState().closeWindow(windowId);
}

export const useExplorerPickerStore = create<ExplorerPickerStore>((set, get) => ({
	active: null,
	pendingResults: {},

	startPicker: (request) => {
		const next: ExplorerPickerRequest = {
			...request,
			id: crypto.randomUUID(),
		};
		set({ active: next });
		return next;
	},

	setPickerWindowId: (windowId) => {
		const active = get().active;
		if (!active) {
			return;
		}
		set({ active: { ...active, pickerWindowId: windowId } });
	},

	cancelPicker: (options) => {
		const active = get().active;
		const pickerWindowId = active?.pickerWindowId;
		set({ active: null });
		if (!options?.skipClose) {
			closePickerWindow(pickerWindowId);
		}
	},

	completePicker: (path) => {
		const active = get().active;
		if (!active) {
			return;
		}
		const pickerWindowId = active.pickerWindowId;
		set((state) => ({
			active: null,
			pendingResults: {
				...state.pendingResults,
				[active.consumerAppId]: path,
			},
		}));
		closePickerWindow(pickerWindowId);
	},

	takeResult: (consumerAppId) => {
		const path = get().pendingResults[consumerAppId];
		if (!path) {
			return null;
		}
		set((state) => {
			const { [consumerAppId]: _removed, ...rest } = state.pendingResults;
			return { pendingResults: rest };
		});
		return path;
	},
}));

export interface OpenExplorerPickerOptions {
	mode: ExplorerPickerMode;
	consumerAppId: string;
	fileTypes?: string[];
	extensions?: string[];
	initialPath?: string;
	defaultFileName?: string;
	title?: string;
}

export async function openExplorerPicker(options: OpenExplorerPickerOptions): Promise<void> {
	const store = useExplorerPickerStore.getState();
	if (store.active) {
		store.cancelPicker();
	}

	const request = store.startPicker(options);
	const pickerAppId =
		options.mode === 'save' ? EXPLORER_SAVE_PICKER_APP_ID : EXPLORER_OPEN_PICKER_APP_ID;
	const windowId = await useAppManager.getState().launchApp(pickerAppId, {
		skipHistory: true,
		title: options.title ?? (options.mode === 'save' ? 'Сохранить файл' : 'Открыть файл'),
		props: { requestId: request.id },
	});
	if (windowId) {
		useExplorerPickerStore.getState().setPickerWindowId(windowId);
	}
}

/**
 * Whether this picker shell instance owns `active`.
 * Used so unmount/WM-close cleanup does not cancel a newer request that reused
 * the same singleInstance `pickerWindowId` (open→open replace race).
 */
export function ownsActivePicker(
	active: ExplorerPickerRequest | null | undefined,
	opts: { windowId: string; requestId?: string },
): boolean {
	if (!active) {
		return false;
	}
	if (active.pickerWindowId && active.pickerWindowId !== opts.windowId) {
		return false;
	}
	if (opts.requestId && active.id !== opts.requestId) {
		return false;
	}
	return true;
}

export function matchesExplorerPickerFilter(
	entry: { type: string; fileType?: string; extension?: string | null },
	picker: ExplorerPickerRequest,
): boolean {
	if (entry.type === 'folder') {
		return true;
	}

	const fileTypes = picker.fileTypes ?? [];
	const extensions = picker.extensions ?? [];
	if (fileTypes.length === 0 && extensions.length === 0) {
		return true;
	}

	if (entry.fileType && fileTypes.includes(entry.fileType)) {
		return true;
	}

	if (entry.extension && extensions.includes(entry.extension)) {
		return true;
	}

	return false;
}
