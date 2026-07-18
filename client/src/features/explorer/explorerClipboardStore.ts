import { create } from 'zustand';

export interface ExplorerClipboard {
	mode: 'copy' | 'cut';
	paths: string[];
}

interface ExplorerClipboardStore {
	clipboard: ExplorerClipboard | null;
	setClipboard: (clipboard: ExplorerClipboard | null) => void;
}

export const useExplorerClipboardStore = create<ExplorerClipboardStore>((set) => ({
	clipboard: null,
	setClipboard: (clipboard) => set({ clipboard }),
}));
