import { create } from 'zustand';

import { userDataApi } from '@/core/api/endpoints/userData';

import {
	OVERLAY_BOARD_ID,
	OVERLAY_SCHOOLTASK_ID,
	OVERLAY_TODO_ID,
	type VisibilityId,
} from './types';

const STORAGE_KEY = 'xos.calendar.visible';
const REMOTE_CODE = 'calendar.visibility';

type VisibilityState = {
	hidden: Set<string>;
	isVisible: (id: VisibilityId | string) => boolean;
	setVisible: (id: VisibilityId | string, visible: boolean) => void;
	toggle: (id: VisibilityId | string) => void;
};

function loadHidden(): Set<string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return new Set();
		}
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object') {
			return new Set();
		}
		const hidden = (parsed as { hidden?: unknown }).hidden;
		if (!Array.isArray(hidden)) {
			return new Set();
		}
		return new Set(hidden.filter((v): v is string => typeof v === 'string'));
	} catch {
		return new Set();
	}
}

function persist(hidden: Set<string>): void {
	const value = { hidden: [...hidden] };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	void userDataApi.upsert({ code: REMOTE_CODE, value });
}

export function hydrateCalendarVisibility(): void {
	void userDataApi.getOptional(REMOTE_CODE).then((dto) => {
		if (dto && dto.value && typeof dto.value === 'object') {
			const hiddenRaw = (dto.value as { hidden?: unknown }).hidden;
			const hidden = new Set(
				Array.isArray(hiddenRaw) ? hiddenRaw.filter((v): v is string => typeof v === 'string') : [],
			);
			useCalendarVisibilityStore.setState({ hidden });
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ hidden: [...hidden] }));
			return;
		}
		const local = loadHidden();
		if (local.size > 0) {
			void userDataApi.upsert({ code: REMOTE_CODE, value: { hidden: [...local] } });
		}
	});
}

export function ownCalendarVisibilityId(id: number): VisibilityId {
	return `own:${id}`;
}

export const useCalendarVisibilityStore = create<VisibilityState>((set, get) => ({
	hidden: loadHidden(),
	isVisible: (id) => !get().hidden.has(id),
	setVisible: (id, visible) => {
		set((state) => {
			const next = new Set(state.hidden);
			if (visible) {
				next.delete(id);
			} else {
				next.add(id);
			}
			persist(next);
			return { hidden: next };
		});
	},
	toggle: (id) => {
		const visible = get().isVisible(id);
		get().setVisible(id, !visible);
	},
}));

export { OVERLAY_TODO_ID, OVERLAY_SCHOOLTASK_ID, OVERLAY_BOARD_ID };
