import { appManager } from './app-system';
import { config } from './config-system';
import roles from './roles-system';
import scopes from './scopes-system';
import { settingManager } from './setting-system';

export const core: {
	$config: any;
	$sm: any;
	$app: any;
	list: Record<string, any>;
	app: Function;
	$scopes: any;
	$roles: any;
	joinScopes: Function;
	getCanScope: Function;
	getLevelScope: Function;
	checkHasScope: Function;
} = {
	$config: config,
	$sm: settingManager,
	$app: appManager,
	$scopes: scopes,
	$roles: roles,
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

	joinScopes(app = '', map = {}) {
		this.$scopes.joinScopes(app, map);
	},
	getCanScope(scope: string) {
		return this.$scopes.getCanScope(scope);
	},
	getLevelScope(scope: string) {
		return this.$scopes.getLevelScope(scope);
	},
	checkHasScope(scope: string) {
		return this.$scopes.checkHasScope(scope);
	},
};
