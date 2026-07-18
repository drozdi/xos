import { create } from 'zustand';

import { useAppManager } from '@/core/appManager/useAppManager';

export type ExplorerPickerMode = 'open' | 'save';

export interface ExplorerPickerRequest {
	id: string;
	mode: ExplorerPickerMode;
	consumerAppId: string;
	fileTypes?: string[];
	extensions?: string[];
	initialPath?: string;
	defaultFileName?: string;
	title?: string;
}

interface ExplorerPickerStore {
	active: ExplorerPickerRequest | null;
	pendingResults: Record<string, string>;
	startPicker: (request: Omit<ExplorerPickerRequest, 'id'>) => ExplorerPickerRequest;
	cancelPicker: () => void;
	completePicker: (path: string) => void;
	takeResult: (consumerAppId: string) => string | null;
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

	cancelPicker: () => set({ active: null }),

	completePicker: (path) => {
		const active = get().active;
		if (!active) {
			return;
		}
		set((state) => ({
			active: null,
			pendingResults: {
				...state.pendingResults,
				[active.consumerAppId]: path,
			},
		}));
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
	useExplorerPickerStore.getState().startPicker(options);
	await useAppManager.getState().launchApp('explorer', {
		title: options.title ?? (options.mode === 'save' ? 'Сохранить файл' : 'Открыть файл'),
	});
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
