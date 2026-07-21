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
	/**
	 * Префикс роли приложения (без ROLE_): main → ROLE_MAIN / ROLE_MAIN_ROOT.
	 * Для защищённых модулей (main, device, explorer, schooltask, inccom).
	 * Не задавать — приложение доступно всем авторизованным с ROLE_USER.
	 */
	requiredRole?: string;
	/** Проверять роль модуля при запуске. По умолчанию true, если задан requiredRole */
	checkRoles?: boolean;
	/** Проверять scope при запуске. По умолчанию true, если задан requiredScope */
	checkScopes?: boolean;
	/** Scope для запуска, если нет полного доступа по роли приложения */
	requiredScope?: string;
	/** Проверка доступа (заменяет requiredRole/requiredScope, если задана) */
	canAccess?: () => boolean;
	wmGroup?: string;
	/** Группа в меню «Пуск» (дерево приложений). По умолчанию — wmGroup */
	startMenuGroup?: string;
	/** Порядок приложения в меню «Пуск» внутри группы. По умолчанию — wmSort или 0 */
	startMenuSort?: number;
	/** Разделитель перед пунктом в меню «Пуск» */
	startMenuBorderTop?: boolean;
	/** Порядок окон внутри wmGroup на панели задач */
	wmSort?: number;
	/** Группа на панели задач (кнопка с hover-списком окон). По умолчанию — id приложения */
	taskbarGroup?: string;
	/** Показывать в меню «Пуск». По умолчанию true */
	startMenu?: boolean;
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
