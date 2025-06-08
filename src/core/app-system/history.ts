import { create } from 'zustand';

export function HistoryStore(fn) {
	return create((set, get) => ({
		histories: [],
		index: -1,
		canGoBack() {
			return get().index <= 0;
		},
		canGoForward() {
			return get().index === get().histories.length - 1;
		},
		isCurrent(history) {
			return get().histories[get().index] === history;
		},
		current() {
			return get().histories[get().index];
		},
		isEmpty() {
			return get().histories.length === 0;
		},
		add(history) {
			const index = ++get().index;
			const histories = get().histories.slice(0, index);
			histories.push(history);
			set({ ...get(), histories, index });
			fn?.(history);
		},
		del() {
			const histories = get().histories.splice(get().index, 1);
			const index = --get().index;
			set({ ...get(), histories, index });
			fn?.(histories[index]);
		},
		init({ histories = [], index = -1 }) {
			set({ ...get(), histories, index });
			fn?.(histories[index]);
		},
		back(callback) {
			if (get().index > 0) {
				const index = --get().index;
				fn?.(get().histories[index]);
				set({ ...get(), index });
				callback?.();
			}
		},
		forward(callback) {
			if (get().index < get().histories.length - 1) {
				const index = ++get().index;
				fn?.(get().histories[index]);
				set({ ...get(), index });
				callback?.();
			}
		},
	}));
}
