import { create } from 'zustand';


export interface NotepadEditorSession {
	path: string | null;
	content: string;
	dirty: boolean;
	loadedPath: string | null;
	saveNonce: number;
	saveAsNonce: number;
	closeNonce: number;
	closeAfterSaveAs: boolean;
}


function emptySession(): NotepadEditorSession {
	return {
		path: null,
		content: '',
		dirty: false,
		loadedPath: null,
		saveNonce: 0,
		saveAsNonce: 0,
		closeNonce: 0,
		closeAfterSaveAs: false,
	};
}


interface NotepadEditorStore {
	sessions: Record<string, NotepadEditorSession>;
	getSession: (windowId: string) => NotepadEditorSession;
	ensureSession: (windowId: string) => NotepadEditorSession;
	patchSession: (windowId: string, patch: Partial<NotepadEditorSession>) => void;
	setContent: (windowId: string, content: string) => void;
	setPath: (windowId: string, path: string | null) => void;
	markLoaded: (windowId: string, path: string, content: string) => void;
	resetDocument: (windowId: string) => void;
	requestSave: (windowId: string) => void;
	requestSaveAs: (windowId: string) => void;
	requestClose: (windowId: string) => void;
	clearSession: (windowId: string) => void;
}


export const useNotepadEditorStore = create<NotepadEditorStore>((set, get) => ({
	sessions: {},


	getSession: (windowId) => get().sessions[windowId] ?? emptySession(),


	ensureSession: (windowId) => {
		const existing = get().sessions[windowId];
		if (existing) {
			return existing;
		}
		const created = emptySession();
		set((state) => ({
			sessions: { ...state.sessions, [windowId]: created },
		}));
		return created;
	},


	patchSession: (windowId, patch) => {
		set((state) => {
			const prev = state.sessions[windowId] ?? emptySession();
			return {
				sessions: {
					...state.sessions,
					[windowId]: { ...prev, ...patch },
				},
			};
		});
	},


	setContent: (windowId, content) => {
		get().patchSession(windowId, { content, dirty: true });
	},


	setPath: (windowId, path) => {
		get().patchSession(windowId, { path });
	},


	markLoaded: (windowId, path, content) => {
		get().patchSession(windowId, {
			path,
			content,
			dirty: false,
			loadedPath: path,
		});
	},


	resetDocument: (windowId) => {
		get().ensureSession(windowId);
		get().patchSession(windowId, {
			path: null,
			content: '',
			dirty: false,
			loadedPath: null,
			closeAfterSaveAs: false,
		});
	},


	requestSave: (windowId) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			saveNonce: prev.saveNonce + 1,
		});
	},


	requestSaveAs: (windowId) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			saveAsNonce: prev.saveAsNonce + 1,
		});
	},


	requestClose: (windowId) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			closeNonce: prev.closeNonce + 1,
		});
	},


	clearSession: (windowId) => {
		set((state) => {
			const { [windowId]: _removed, ...rest } = state.sessions;
			return { sessions: rest };
		});
	},
}));


export const NOTEPAD_SAVE_AS_CONSUMER = 'explorer-notepad:saveAs';
