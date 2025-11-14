import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WmStoreValue {
	zIndex: number;
	current: string | undefined;
	stack: { [key: string]: any };
	stacks: { [key: string]: any };
	setZIndex: (zIndex: number) => void;
	active: (win: any) => void;
	disable: () => void;
	isActive: (win: any) => boolean;
	add: (win: any) => void;
	del: (win: any) => void;
}

export const useWmStore = create(
	persist<WmStoreValue>(
		(set, get) => ({
			zIndex: 100,
			current: undefined,
			stack: {},
			stacks: {},
			setZIndex(zIndex) {
				if (zIndex > get().zIndex) {
					set({ zIndex });
				}
			},
			active(win) {
				if (win.uid !== get().current) {
					set({ current: win?.uid });
				}
			},
			disable() {
				set({ current: undefined });
			},
			isActive(win) {
				return get().current === win.uid;
			},
			add(win) {
				const stack = get().stack;
				const stacks = get().stacks;

				if (win.wmGroup) {
					stacks[win.wmGroup] = stacks[win.wmGroup] || [];

					let o = stacks[win.wmGroup][0] || null;
					o = (o || {}).uid || 0;
					delete stack[o];

					stacks[win.wmGroup].push(win);
					stacks[win.wmGroup].sort((a, b) => a.wmSort - b.wmSort);

					let n = stacks[win.wmGroup][0];
					stack[n.uid] = n;
				} else {
					stack[win.uid] = win;
				}

				set({ stack, stacks });
			},
			del(win) {
				const stack = get().stack;
				const stacks = get().stacks;
				if (win.wmGroup) {
					const i = stacks[win.wmGroup].findIndex((w) => w.uid === win.uid);
					if (i > -1) {
						stacks[win.wmGroup].splice(i, 1);
						stacks[win.wmGroup].sort((a, b) => a.wmSort - b.wmSort);
						delete stack[win.uid];
						let n = stacks[win.wmGroup][0];
						if (n) {
							stack[n.uid] = n;
						}
					}
				} else {
					delete stack[win.uid];
				}
				set({ stack, stacks });
			},
		}),
		{
			name: 'windows-manager',
			partialize: (state: WmStoreValue) => ({
				current: state.current,
			}),
		},
	),
);
