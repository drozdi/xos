import type { ReactNode } from 'react';

import type { WindowDragConfig } from './windowDrag';
import type { WindowAutoSizeMode } from './windowLayout';

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
	taskbarGroup: string;
	contentKey: number;
	dragHandles?: string[];
	dragCancel?: string[];
	resizable: boolean;
	positionFixed: boolean;
	autoSize: WindowAutoSizeMode;
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
	taskbarGroup?: string;
	dragHandles?: string[];
	dragCancel?: string[];
	resizable?: boolean;
	positionFixed?: boolean;
	autoSize?: WindowAutoSizeMode;
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
	setDragOptions: (options: WindowDragConfig) => void;
	setResizable: (resizable: boolean) => void;
	setPositionFixed: (fixed: boolean) => void;
	setAutoSize: (mode: WindowAutoSizeMode) => void;
	fitToContent: () => void;
	on: (event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => () => void;
	off: (event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => void;
	createChildWindow: (options: ChildWindowOptions) => ChildWindowHandle;
}
