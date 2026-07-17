import { create } from 'zustand';

interface ChessStore {
	restartKey: number;
	requestRestart: () => void;
}

export const useChessStore = create<ChessStore>((set) => ({
	restartKey: 0,
	requestRestart: () => set((state) => ({ restartKey: state.restartKey + 1 })),
}));
