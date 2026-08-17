import { create } from 'zustand';


import {
	defaultMarkdownViewMode,
	normalizeMarkdownViewMode,
	type MarkdownViewMode,
} from './markdownViewMode';

export type { MarkdownViewMode } from './markdownViewMode';


export type MarkdownFormatCommand =
	| 'bold'
	| 'italic'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'ul'
	| 'ol'
	| 'quote'
	| 'code'
	| 'codeBlock'
	| 'link'
	| 'hr';


export interface MarkdownEditorSession {
	path: string | null;
	content: string;
	dirty: boolean;
	viewMode: MarkdownViewMode;
	loadedPath: string | null;
	formatNonce: number;
	formatCommand: MarkdownFormatCommand | null;
	undoNonce: number;
	redoNonce: number;
	saveNonce: number;
	saveAsNonce: number;
	closeNonce: number;
	closeAfterSaveAs: boolean;
	readOnly: boolean;
}


function emptySession(): MarkdownEditorSession {
	return {
		path: null,
		content: '',
		dirty: false,
		viewMode: 'live',
		loadedPath: null,
		formatNonce: 0,
		formatCommand: null,
		undoNonce: 0,
		redoNonce: 0,
		saveNonce: 0,
		saveAsNonce: 0,
		closeNonce: 0,
		closeAfterSaveAs: false,
		readOnly: false,
	};
}

export const EMPTY_MARKDOWN_SESSION = emptySession();


interface MarkdownEditorStore {
	sessions: Record<string, MarkdownEditorSession>;
	getSession: (windowId: string) => MarkdownEditorSession;
	ensureSession: (windowId: string) => MarkdownEditorSession;
	patchSession: (windowId: string, patch: Partial<MarkdownEditorSession>) => void;
	setContent: (windowId: string, content: string) => void;
	setPath: (windowId: string, path: string | null) => void;
	setViewMode: (windowId: string, viewMode: MarkdownViewMode) => void;
	markLoaded: (windowId: string, path: string, content: string) => void;
	resetDocument: (windowId: string) => void;
	requestFormat: (windowId: string, command: MarkdownFormatCommand) => void;
	requestUndo: (windowId: string) => void;
	requestRedo: (windowId: string) => void;
	requestSave: (windowId: string) => void;
	requestSaveAs: (windowId: string) => void;
	requestClose: (windowId: string) => void;
	clearSession: (windowId: string) => void;
}


export const useMarkdownEditorStore = create<MarkdownEditorStore>((set, get) => ({
	sessions: {},


	getSession: (windowId) => {
		const session = get().sessions[windowId] ?? emptySession();
		return {
			...session,
			viewMode: normalizeMarkdownViewMode(session.viewMode),
		};
	},


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
			const nextViewMode =
				patch.viewMode !== undefined
					? normalizeMarkdownViewMode(patch.viewMode)
					: undefined;
			const entries = Object.entries(patch) as [keyof MarkdownEditorSession, unknown][];
			const unchanged = entries.every(([key, value]) => {
				if (key === 'viewMode') {
					return normalizeMarkdownViewMode(prev.viewMode) === nextViewMode;
				}
				return prev[key] === value;
			});
			if (unchanged) {
				return state;
			}
			return {
				sessions: {
					...state.sessions,
					[windowId]: {
						...prev,
						...patch,
						...(nextViewMode !== undefined ? { viewMode: nextViewMode } : {}),
					},
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


	setViewMode: (windowId, viewMode) => {
		get().patchSession(windowId, { viewMode: normalizeMarkdownViewMode(viewMode) });
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
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			path: null,
			content: '',
			dirty: false,
			loadedPath: null,
			formatCommand: null,
			closeAfterSaveAs: false,
			viewMode: prev.viewMode,
		});
	},


	requestFormat: (windowId, command) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			formatCommand: command,
			formatNonce: prev.formatNonce + 1,
		});
	},


	requestUndo: (windowId) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			undoNonce: prev.undoNonce + 1,
		});
	},


	requestRedo: (windowId) => {
		const prev = get().ensureSession(windowId);
		get().patchSession(windowId, {
			redoNonce: prev.redoNonce + 1,
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


export const MARKDOWN_SAVE_AS_CONSUMER = 'explorer-markdown-viewer:saveAs';

