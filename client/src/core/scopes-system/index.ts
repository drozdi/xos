import { scopesAPI } from './api';

interface IScope {
	app: string;
	parent: any;
	checkHasScope(s: string): boolean;
	getRoleRoot(s: string): string[];
	getRoleAdmin(s: string): string;
}
interface ICoreScope {
	mapScopes: Record<string, any>;
	levelScopes: Record<string, any>;
	cacheLevelScopes: Record<string, any>;
	cacheScopes: Record<string, any>;
	subs: Record<string, any>;
	joinLevel(key: Record<string, any> | string, level?: number): void;
	joinScopes(app: string, map: Record<string, any>): void;
	getCanScope(scope: string): number;
	getLevelScope(scope: string): number;
	checkHasScope(scope: string): boolean;
	getRoleRoot(scope: string): string[];
	getRoleAdmin(scope: string): string;
	sub(app: string): IScope;
	load(): void;
}

class Scope implements IScope {
	app;
	parent;
	constructor(app = '', parent: any) {
		this.app = app;
		this.parent = parent;
	}
	checkHasScope(s: string) {
		let scope = s.split('.');
		let can = scope.shift() as string;
		if (scope.length === 0) {
			scope.unshift(this.app);
		}
		scope.unshift(can);
		return this.parent.checkHasScope(scope.join('.'));
	}
	getRoleRoot(s: string) {
		let scope = s.split('.').slice(s.substr(0, 4) == 'can_' ? 1 : 0);
		scope.unshift(this.app);
		return scope.map((e, i) => {
			return scope
				.slice(0, i + 1)
				.push('root')
				.join('_')
				.toUpperCase();
		});
	}
	getRoleAdmin(s: string) {
		let scope = s.split('.').slice(s.substr(0, 4) == 'can_' ? 1 : 0);
		scope.unshift(this.app);
		scope.push('admin');
		return scope.join('_').toUpperCase();
	}
}

const coreScopes: ICoreScope = {
	mapScopes: {},
	levelScopes: {},
	cacheLevelScopes: {},
	cacheScopes: {},
	subs: {},
	joinLevel(key = {}, level = 0) {
		if (typeof key === 'object') {
			Object.entries(key).forEach((v) => {
				this.joinLevel(v[0], v[1]);
			});
		} else {
			this.levelScopes[key] = level | (this.levelScopes[key] || 0);
		}
	},
	joinScopes(app = '', map = {}) {
		function enumeration(sub = {}) {
			Object.keys(sub).forEach((key) => {
				if (key.substr(0, 4) === 'can_') {
					map[key] = sub[key];
				} else {
					enumeration(sub[key] || {});
				}
			});
		}
		enumeration(map);
		this.mapScopes[app] = map;
	},
	getCanScope(s) {
		let scope = s.split('.');
		let can = scope.shift();
		return (
			scope.reduce((arr, key) => {
				return arr[key] || {};
			}, this.mapScopes)[can] || 0
		);
	},
	getLevelScope(s) {
		let scope = s.split('.').slice(s.substr(0, 4) == 'can_' ? 1 : 0);
		if (this.cacheLevelScopes[scope.join('.')]) {
			return this.cacheLevelScopes[scope.join('.')];
		}
		let level = 0;
		let current = '';
		scope.forEach((key) => {
			current += current ? '.' : '';
			current += key;
			level = level | (this.levelScopes[current] || 0);
		});
		return (this.cacheLevelScopes[scope.join('.')] = level);
	},
	checkHasScope(scope) {
		let not = false;
		if (scope.substr(0, 1) === '!') {
			not = true;
			scope = scope.substr(1);
		}
		let result = Boolean(this.getLevelScope(scope) & this.getCanScope(scope));

		return not ? !result : result;
	},
	getRoleRoot(s) {
		let scope = s.split('.').slice(s.substr(0, 4) == 'can_' ? 1 : 0);
		return scope.map((e, i) => {
			return scope
				.slice(0, i + 1)
				.push('root')
				.join('_')
				.toUpperCase();
		});
	},
	getRoleAdmin(s) {
		let scope = s.split('.').slice(s.substr(0, 4) == 'can_' ? 1 : 0);
		scope.push('admin');
		return scope.join('_').toUpperCase();
	},
	sub(app = '') {
		if (!this.subs[app]) {
			this.subs[app] = new Scope(app, this);
		}
		return this.subs[app];
	},
	async load() {
		return await Promise.all([
			scopesAPI.getMap().then(({ data }) => {
				for (let k in data) {
					coreScopes.joinScopes(k, data[k]);
				}
				return data;
			}),
			scopesAPI.getAccesses().then(({ data }) => {
				coreScopes.joinLevel(data || {});
				return data;
			}),
		]);
	},
};

export default coreScopes;
