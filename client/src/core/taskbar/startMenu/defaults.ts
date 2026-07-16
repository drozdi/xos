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
	default: 'Приложения',
};

export const DEFAULT_PINNED_APPS = ['demo-calculator', 'tic-tac-toe', 'sudoku', 'settings'];

export const DEFAULT_QUICK_ACTIONS: StartMenuQuickAction[] = [
	{ id: 'quick-users', type: 'app', appId: 'users', label: 'Пользователи' },
];
