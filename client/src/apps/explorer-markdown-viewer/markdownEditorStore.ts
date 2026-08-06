import { create } from 'zustand';


export type MarkdownViewMode = 'edit' | 'preview' | 'split';


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
	saveNonce: number;
	saveAsNonce: number;
	closeNonce: number;
	closeAfterSaveAs: boolean;
}


function emptySession(): MarkdownEditorSession {
	return {
		path: null,
		content: '',
		dirty: false,
		viewMode: 'edit',
		loadedPath: null,
		formatNonce: 0,
		formatCommand: null,
		saveNonce: 0,
		saveAsNonce: 0,
		closeNonce: 0,
		closeAfterSaveAs: false,
	};
}


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
	requestSave: (windowId: string) => void;
	requestSaveAs: (windowId: string) => void;
	requestClose: (windowId: string) => void;
	clearSession: (windowId: string) => void;
}


export const useMarkdownEditorStore = create<MarkdownEditorStore>((set, get) => ({
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


	setViewMode: (windowId, viewMode) => {
		get().patchSession(windowId, { viewMode });
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

