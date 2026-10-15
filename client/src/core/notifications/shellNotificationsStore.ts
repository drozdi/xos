import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShellNotificationKind =
	| 'todo_due'
	| 'board_due'
	| 'inbox'
	| 'local_reminder'
	| 'info'
	| 'system';

export interface ShellNotification {
	id: string;
	kind: ShellNotificationKind;
	title: string;
	body?: string;
	createdAt: string;
	read: boolean;
	/** launchApp payload */
	launch?: { appId: string; props?: Record<string, unknown>; instanceKey?: string };
	/** dedupe key e.g. todo-due:123 */
	dedupeKey?: string;
}

interface ShellNotificationsState {
	items: ShellNotification[];
	push: (n: Omit<ShellNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => boolean;
	markRead: (id: string) => void;
	markAllRead: () => void;
	clear: () => void;
	unreadCount: () => number;
}

const MAX_ITEMS = 50;

export const useShellNotifications = create<ShellNotificationsState>()(
	persist(
		(set, get) => ({
			items: [],
			push: (n) => {
				if (n.dedupeKey && get().items.some((i) => i.dedupeKey === n.dedupeKey && !i.read)) {
					return false;
				}
				if (n.dedupeKey && get().items.some((i) => i.dedupeKey === n.dedupeKey)) {
					// already notified once this session/persist — skip toast spam for same due item
					const recent = get().items.find((i) => i.dedupeKey === n.dedupeKey);
					if (recent) {
						const age = Date.now() - new Date(recent.createdAt).getTime();
						if (age < 6 * 60 * 60 * 1000) {
							return false;
						}
					}
				}
				const item: ShellNotification = {
					id: n.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					kind: n.kind,
					title: n.title,
					body: n.body,
					createdAt: new Date().toISOString(),
					read: false,
					launch: n.launch,
					dedupeKey: n.dedupeKey,
				};
				set((state) => ({
					items: [item, ...state.items].slice(0, MAX_ITEMS),
				}));
				return true;
			},
			markRead: (id) =>
				set((state) => ({
					items: state.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
				})),
			markAllRead: () =>
				set((state) => ({
					items: state.items.map((i) => ({ ...i, read: true })),
				})),
			clear: () => set({ items: [] }),
			unreadCount: () => get().items.filter((i) => !i.read).length,
		}),
		{ name: 'xos-shell-notifications' },
	),
);
