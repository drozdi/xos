import { config } from '../config-system';
import { Setting } from './lib/setting';
import { SettingManager } from './lib/setting-manager';

export const settingManager = new SettingManager({
	CONFIG: config,
	APP: new Setting({}, {}, 'HKEY_APPLICATION'),
	LAYOUT: new Setting(
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
		{},
		'HKEY_LAYOUT',
	),
	MODAL: new Setting({}, {}, 'HKEY_MODAL'),
	WINDOW: new Setting(
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
				active: false,
				def: true,
			},
			parent: document.body,
		},
		{},
		'HKEY_WINDOWS',
	),
	FORM: new Setting({}, {}, 'WIN_FORM'),
	TABLE: new Setting({}, {}, 'WIN_TABLE'),
});
