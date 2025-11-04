import { rolesAPI } from './api';

interface IRoles {
	roles: string[];
	parent?: any;
	app?: string;
	isRole(role: string): boolean;
	isRoot(): boolean;
	isAdmin(mod?: string): boolean;
}

interface ICoreRoles {
	roles: string[];
	subs: Record<string, IRoles>;
	joinRole(role: string | string[]): void;
	isRole(role: string): boolean;
	isRoot(): boolean;
	sub(app: string): IRoles;
	isAdmin(mod?: string): boolean;
	load(): void;
}

class Roles implements IRoles {
	parent = undefined;
	roles = [];
	app = '';
	constructor(app: string, parent?: any) {
		this.app = app;
		this.parent = parent;
	}
	isRole(role = '') {
		return this.parent?.isRole(`${this.app}_${role}`);
	}
	isRoot() {
		return this.isRole('root');
	}
	isAdmin(mod = '') {
		mod += mod ? '_' : '';
		return this.isRole(`${mod}admin`);
	}
}

const coreRoles: ICoreRoles = {
	roles: [],
	subs: {},
	joinRole(role) {
		this.roles.push(role);
		//this.roles = (this.roles || []).concat(role).values();
	},
	isRole(role) {
		role = (role || '').toUpperCase();
		if (role.substr(0, 5) !== 'ROLE_') {
			role = 'ROLE_' + role;
		}
		return this.roles.includes(role);
	},
	isRoot() {
		return this.isRole('root');
	},
	isAdmin(mod = '') {
		mod += mod ? '_' : '';
		return this.isRole(`${mod}admin`);
	},
	sub(app = '') {
		if (!this.subs[app]) {
			this.subs[app] = new Roles(app, this);
		}
		return this.subs[app];
	},
	async load() {
		return await rolesAPI.getRoles().then((data) => {
			data.forEach((role, index) => {
				this.joinRole(role);
			});
			return data;
		});
	},
};

export default coreRoles;
