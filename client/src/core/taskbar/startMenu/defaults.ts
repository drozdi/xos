import type { StartMenuQuickAction } from './types';

export const START_MENU_PANEL_WIDTH = 680;
export const START_MENU_PANEL_HEIGHT = 520;
export const START_MENU_SIDEBAR_WIDTH = 52;
export const START_MENU_SIDEBAR_EXPANDED_WIDTH = 220;
export const START_MENU_TILES_WIDTH = 248;

export const START_MENU_GROUP_LABELS: Record<string, string> = {
	system: 'Система',
	tools: 'Средства',
	games: 'Игры',
	admin: 'Администрирование',
	device: 'Устройства',
	schooltask: 'Школа',
	inccom: 'Финансы',
	default: 'Приложения',
};

export const DEFAULT_PINNED_APPS = [
	'explorer',
	'demo-calculator',
	'browser',
	'tic-tac-toe',
	'sudoku',
	'settings',
	'main-users',
	'main-groups',
	'main-ous',
	'main-claimants',
	'device-devices',
	'device-sub-devices',
	'device-types',
	'device-properties',
	'device-components',
	'device-softwares',
	'device-licenses',
	'device-license-keys',
	'inccom',
];

export const DEFAULT_QUICK_ACTIONS: StartMenuQuickAction[] = [
	{ id: 'quick-users', type: 'app', appId: 'main-users', label: 'Пользователи' },
	{ id: 'quick-groups', type: 'app', appId: 'main-groups', label: 'Группы' },
	{ id: 'quick-ous', type: 'app', appId: 'main-ous', label: 'Подразделения' },
	{ id: 'quick-claimants', type: 'app', appId: 'main-claimants', label: 'Заявители' },
];
