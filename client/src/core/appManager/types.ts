import type { LazyExoticComponent, ComponentType } from 'react';

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
	singleInstance?: boolean;
	instanceKey?: string | ((params?: LaunchParams) => string);
}

export interface RunningApp {
	windowId: string;
	appId: string;
	instanceKey: string;
}
