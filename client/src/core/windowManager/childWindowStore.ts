import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface ChildWindowState {
	id: string;
	title: string;
	width: number;
	height: number;
	content: ReactNode;
	open: boolean;
}

interface ChildWindowStore {
	byParent: Record<string, ChildWindowState[]>;
	addChild: (parentWindowId: string, child: ChildWindowState) => void;
	removeChild: (parentWindowId: string, childId: string) => void;
	clearParent: (parentWindowId: string) => void;
	getOpenChildren: (parentWindowId: string) => ChildWindowState[];
}

export const useChildWindowStore = create<ChildWindowStore>((set, get) => ({
	byParent: {},

	addChild: (parentWindowId, child) => {
		set((state) => {
			const existing = state.byParent[parentWindowId] ?? [];
			return {
				byParent: {
					...state.byParent,
					[parentWindowId]: [...existing, child],
				},
			};
		});
	},

	removeChild: (parentWindowId, childId) => {
		set((state) => {
			const existing = state.byParent[parentWindowId];
			if (!existing) {return state;}

			const next = existing.filter((child) => child.id !== childId);
			if (next.length === 0) {
				const { [parentWindowId]: _removed, ...rest } = state.byParent;
				return { byParent: rest };
			}

			return {
				byParent: {
					...state.byParent,
					[parentWindowId]: next,
				},
			};
		});
	},

	clearParent: (parentWindowId) => {
		set((state) => {
			if (!state.byParent[parentWindowId]) {return state;}
			const { [parentWindowId]: _removed, ...rest } = state.byParent;
			return { byParent: rest };
		});
	},

	getOpenChildren: (parentWindowId) => {
		return (get().byParent[parentWindowId] ?? []).filter((child) => child.open);
	},
}));
