export type StartMenuCommand = 'settings' | 'logout' | 'reload';

export interface StartMenuQuickAction {
	id: string;
	type: 'app' | 'command';
	appId?: string;
	command?: StartMenuCommand;
	label?: string;
}

export interface StartMenuAppGroup {
	id: string;
	label: string;
	apps: Array<{ id: string; name: string; borderTop?: boolean }>;
}

export const START_MENU_SETTING_KEYS = {
	pinnedApps: 'startMenu.pinnedApps',
	quickActions: 'startMenu.quickActions',
} as const;
