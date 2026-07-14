import type { ReactNode } from 'react';

export interface WindowState {
	id: string;
	appId: string;
	instanceKey: string;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	minimized: boolean;
	maximized: boolean;
	wmGroup: string;
	wmSort: number;
	contentKey: number;
	preMaximize?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface OpenWindowPayload {
	id?: string;
	appId: string;
	instanceKey: string;
	title: string;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	minimized?: boolean;
	maximized?: boolean;
	wmGroup?: string;
	wmSort?: number;
}

export interface PersistedWindowState {
	position: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	state: {
		minimized: boolean;
		maximized: boolean;
	};
	wmGroup: string;
	wmSort: number;
	title: string;
}

export type WindowEvent = 'close' | 'focus' | 'resize';

export type CloseEventHandler = () => boolean | void | Promise<boolean | void>;
export type WindowEventHandler = () => void;

export interface ChildWindowOptions {
	title?: string;
	width?: number;
	height?: number;
	content?: ReactNode;
}

export interface ChildWindowHandle {
	id: string;
	close: () => void;
}

export interface WindowApi {
	close: (force?: boolean) => Promise<boolean>;
	minimize: () => void;
	maximize: () => void;
	restore: () => void;
	refresh: () => void;
	setTitle: (title: string) => void;
	setSize: (width: number, height: number) => void;
	setPosition: (x: number, y: number) => void;
	on: (event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => () => void;
	off: (event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => void;
	createChildWindow: (options: ChildWindowOptions) => ChildWindowHandle;
}
