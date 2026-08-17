import { create } from 'zustand';

import { defaultPlaylistName, type MediaPlayerKind } from './playlistFormat';

export interface MediaPlayerSession {
	kind: MediaPlayerKind;
	playlistPath: string | null;
	playlistName: string;
	items: string[];
	currentPath: string | null;
	dirty: boolean;
	saveNonce: number;
	saveAsNonce: number;
	openPlaylistNonce: number;
	addFilesNonce: number;
	newPlaylistNonce: number;
}

function emptySession(kind: MediaPlayerKind): MediaPlayerSession {
	return {
		kind,
		playlistPath: null,
		playlistName: defaultPlaylistName(kind),
		items: [],
		currentPath: null,
		dirty: false,
		saveNonce: 0,
		saveAsNonce: 0,
		openPlaylistNonce: 0,
		addFilesNonce: 0,
		newPlaylistNonce: 0,
	};
}

interface MediaPlayerStore {
	sessions: Record<string, MediaPlayerSession>;
	getSession: (windowId: string, kind: MediaPlayerKind) => MediaPlayerSession;
	ensureSession: (windowId: string, kind: MediaPlayerKind) => MediaPlayerSession;
	patchSession: (windowId: string, patch: Partial<MediaPlayerSession>) => void;
	setItems: (windowId: string, items: string[], dirty?: boolean) => void;
	addItem: (windowId: string, path: string) => void;
	removeItem: (windowId: string, path: string) => void;
	moveItem: (windowId: string, path: string, direction: -1 | 1) => void;
	setCurrentPath: (windowId: string, path: string | null) => void;
	loadPlaylist: (
		windowId: string,
		playlistPath: string,
		playlistName: string,
		items: string[],
		currentPath: string | null,
	) => void;
	resetPlaylist: (windowId: string, kind: MediaPlayerKind) => void;
	requestSave: (windowId: string) => void;
	requestSaveAs: (windowId: string) => void;
	requestOpenPlaylist: (windowId: string) => void;
	requestAddFiles: (windowId: string) => void;
	requestNewPlaylist: (windowId: string) => void;
	clearSession: (windowId: string) => void;
}

export const useMediaPlayerStore = create<MediaPlayerStore>((set, get) => ({
	sessions: {},

	getSession: (windowId, kind) => {
		const session = get().sessions[windowId];
		return session ?? emptySession(kind);
	},

	ensureSession: (windowId, kind) => {
		const existing = get().sessions[windowId];
		if (existing) {
			return existing;
		}
		const created = emptySession(kind);
		set((state) => ({
			sessions: { ...state.sessions, [windowId]: created },
		}));
		return created;
	},

	patchSession: (windowId, patch) => {
		set((state) => {
			const prev = state.sessions[windowId] ?? emptySession('audio');
			return {
				sessions: {
					...state.sessions,
					[windowId]: { ...prev, ...patch },
				},
			};
		});
	},

	setItems: (windowId, items, dirty = true) => {
		get().patchSession(windowId, { items, dirty });
	},

	addItem: (windowId, path) => {
		const session = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		if (session.items.includes(path)) {
			return;
		}
		get().patchSession(windowId, {
			items: [...session.items, path],
			dirty: true,
		});
	},

	removeItem: (windowId, path) => {
		const session = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		const items = session.items.filter((item) => item !== path);
		const currentPath = session.currentPath === path ? (items[0] ?? null) : session.currentPath;
		get().patchSession(windowId, { items, currentPath, dirty: true });
	},

	moveItem: (windowId, path, direction) => {
		const session = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		const index = session.items.indexOf(path);
		if (index < 0) {
			return;
		}
		const target = index + direction;
		if (target < 0 || target >= session.items.length) {
			return;
		}
		const items = [...session.items];
		[items[index], items[target]] = [items[target], items[index]];
		get().patchSession(windowId, { items, dirty: true });
	},

	setCurrentPath: (windowId, path) => {
		get().patchSession(windowId, { currentPath: path });
	},

	loadPlaylist: (windowId, playlistPath, playlistName, items, currentPath) => {
		get().patchSession(windowId, {
			playlistPath,
			playlistName,
			items,
			currentPath,
			dirty: false,
		});
	},

	resetPlaylist: (windowId, kind) => {
		get().patchSession(windowId, {
			...emptySession(kind),
			kind,
		});
	},

	requestSave: (windowId) => {
		const prev = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		get().patchSession(windowId, { saveNonce: prev.saveNonce + 1 });
	},

	requestSaveAs: (windowId) => {
		const prev = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		get().patchSession(windowId, { saveAsNonce: prev.saveAsNonce + 1 });
	},

	requestOpenPlaylist: (windowId) => {
		const prev = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		get().patchSession(windowId, { openPlaylistNonce: prev.openPlaylistNonce + 1 });
	},

	requestAddFiles: (windowId) => {
		const prev = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		get().patchSession(windowId, { addFilesNonce: prev.addFilesNonce + 1 });
	},

	requestNewPlaylist: (windowId) => {
		const prev = get().ensureSession(windowId, get().sessions[windowId]?.kind ?? 'audio');
		get().patchSession(windowId, { newPlaylistNonce: prev.newPlaylistNonce + 1 });
	},

	clearSession: (windowId) => {
		set((state) => {
			const { [windowId]: _removed, ...rest } = state.sessions;
			return { sessions: rest };
		});
	},
}));

export function mediaPlayerSaveAsConsumer(appId: string, windowId: string): string {
	return `${appId}:playlist:saveAs:${windowId}`;
}

export function mediaPlayerOpenPlaylistConsumer(appId: string, windowId: string): string {
	return `${appId}:playlist:open:${windowId}`;
}

export function mediaPlayerAddFilesConsumer(appId: string, windowId: string): string {
	return `${appId}:playlist:add:${windowId}`;
}
