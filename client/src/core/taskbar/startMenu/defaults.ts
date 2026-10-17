import type { StartMenuQuickAction } from './types';

export const START_MENU_PANEL_WIDTH = 680;
export const START_MENU_PANEL_HEIGHT = 520;
export const START_MENU_SIDEBAR_WIDTH = 52;
export const START_MENU_SIDEBAR_EXPANDED_WIDTH = 220;
export const START_MENU_TILES_WIDTH = 248;

export const START_MENU_GROUP_LABELS: Record<string, string> = {
	system: 'Система',
	tools: 'Стандартные',
	games: 'Игры',
	admin: 'Администрирование',
	device: 'Устройства',
	schooltask: 'Школа',
	inccom: 'Финансы',
	ts: 'TeamStorm',
	content: 'Контент',
	iblock: 'Инфоблоки',
	default: 'Приложения',
};

export const START_MENU_GROUP_SORT: Record<string, number> = {
	admin: 0,
	system: 10,
	tools: 20,
	games: 30,
	device: 40,
	schooltask: 50,
	inccom: 60,
	ts: 65,
	content: 68,
	iblock: 70,
	default: 100,
};

export const DEFAULT_PINNED_APPS: string[] = [];

export const DEFAULT_QUICK_ACTIONS: StartMenuQuickAction[] = [
	{ id: 'quick-users', type: 'app', appId: 'main-users', label: 'Пользователи' },
	{ id: 'quick-groups', type: 'app', appId: 'main-groups', label: 'Группы' },
	{ id: 'quick-ous', type: 'app', appId: 'main-ous', label: 'Подразделения' },
	{ id: 'quick-claimants', type: 'app', appId: 'main-claimants', label: 'Доступные права' },
];
