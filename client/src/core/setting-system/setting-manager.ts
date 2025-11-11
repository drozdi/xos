import { config } from '../config-system';
import { Setting } from './lib/setting';
import { SettingManager } from './lib/setting-manager';

export const settingManager = new SettingManager({
	CONFIG: config,
	APP: new Setting(config, {}, 'HKEY_APPLICATION'),
	LAYOUT: new Setting(
		config,
		{
			left: {
				width: 300,
				open: true,
				mini: true,
			},
			right: {
				width: 300,
				open: true,
				mini: true,
			},
		},
		'HKEY_LAYOUT',
	),
	MODAL: new Setting(config, {}, 'HKEY_MODAL'),
	WINDOW: new Setting(
		config,
		{
			position: {
				top: 50,
				left: 50,
				width: 300,
				height: 300,
				zIndex: 100,
			},
			state: {
				isFullscreen: false,
				isCollapse: false,
				isActive: false,
			},
			parent: 'body',
		},
		'HKEY_WINDOWS',
	),
	FORM: new Setting(config, {}, 'WIN_FORM'),
	TABLE: new Setting(config, {}, 'WIN_TABLE'),
});
