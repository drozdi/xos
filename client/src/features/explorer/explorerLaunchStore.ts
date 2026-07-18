import { create } from 'zustand';

export interface ExplorerOpenRequest {
	vfsPath: string;
	appId: string;
}

interface ExplorerLaunchStore {
	pending: ExplorerOpenRequest | null;
	setOpenRequest: (request: ExplorerOpenRequest) => void;
	consumeOpenRequest: (appId: string) => ExplorerOpenRequest | null;
}

export const useExplorerLaunchStore = create<ExplorerLaunchStore>((set, get) => ({
	pending: null,
	setOpenRequest: (request) => set({ pending: request }),
	consumeOpenRequest: (appId) => {
		const pending = get().pending;
		if (!pending || pending.appId !== appId) {
			return null;
		}
		set({ pending: null });
		return pending;
	},
}));
