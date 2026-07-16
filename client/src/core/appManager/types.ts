import type { LazyExoticComponent, ComponentType } from 'react';

import type { ContextMenuConfig } from '@/core/contextMenu/types';
import type { AppMenuSource } from '@/core/appMenu/types';
import type { WindowDragConfig } from '@/core/windowManager/windowDrag';
import type { WindowLayoutConfig } from '@/core/windowManager/windowLayout';

export interface LaunchParams {
	instanceKey?: string;
	title?: string;
	props?: Record<string, unknown>;
	skipHistory?: boolean;
}

export interface AppManifest {
	id: string;
	name: string;
	version: string;
	icon: ComponentType<{ size?: number }> | string;
	component: LazyExoticComponent<ComponentType>;
	defaultSize: { width: number; height: number };
	minSize?: { width: number; height: number };
	requiredRole?: string;
	requiredScope?: string;
	wmGroup?: string;
	/** Группа в меню «Пуск» (дерево приложений). По умолчанию — wmGroup */
	startMenuGroup?: string;
	/** Группа на панели задач (кнопка с hover-списком окон). По умолчанию — id приложения */
	taskbarGroup?: string;
	singleInstance?: boolean;
	instanceKey?: string | ((params?: LaunchParams) => string);
	contextMenu?: ContextMenuConfig;
	/** Верхнее меню: inline-конфиг или lazy loader из отдельного файла */
	menu?: AppMenuSource;
	/** Настройки окна: перетаскивание, размер, позиция */
	window?: WindowDragConfig & WindowLayoutConfig;
}

export interface RunningApp {
	windowId: string;
	appId: string;
	instanceKey: string;
}
