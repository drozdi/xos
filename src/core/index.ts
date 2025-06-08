import { appManager } from './app-system/app-manager';
import { config } from './config-system/config';
import { settingManager } from './setting-system/setting-manager';

export const core: {
	$config: any;
	$sm: any;
	$app: any;
	list: Record<string, any>;
	app: Function;
} = {
	$config: config,
	$sm: settingManager,
	$app: appManager,
	list: {},
	app(proto: any, conf = {}, root: any): any {
		root = root ?? appManager.createRoot();
		if (!this.list[proto.displayName]) {
			root.render(
				(this.list[proto.displayName] = appManager.buildApp(proto, conf, false)),
			);
		}
		return this.list[proto.displayName];
	},
};
