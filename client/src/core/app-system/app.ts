import { useEffect } from 'react';
import { EventBus } from '../../utils/EventBus';
import { appManager } from './app-manager';
import { HistoryStore } from './history';
import { Storage } from './storage.ts';

export type ConfigObject = Record<string, any>;
export interface IAppPorps {
	[key: string]: any;
}
export interface IApp {
	constructor(props: IAppPorps): any;
	win: any;
	register(instance: any): void;
	unRegister(instance: any): void;
	default(config: ConfigObject): void;
	config(key: string): any;
	history(fn: Function): any;
	sm(type: string): any;
	active(...args: any[]): void;
	deActive(...args: any[]): void;
	mount(): void;
	unMount(): void;
}

export class App extends EventBus {
	root: any = null;
	smKey?: string;
	isActive?: boolean = false;
	pathName?: string;
	element?: any;
	__history: { current: any } = { current: null };
	__config: ConfigObject = {};
	__instance: ConfigObject = {};
	constructor({ smKey, ...props }: IAppPorps) {
		super();
		this.smKey = smKey;
		this.default(props);
		'remove close reload'.split(/\s+/).forEach((evt: string) => {
			this[evt] = (...args: any[]) => this.emit(evt, ...args);
		});
	}
	get win() {
		return this.__instance.window;
	}
	register(instance: any): void {
		if (instance?.__) {
			this.__instance[instance.__] = instance;
		}
	}
	unRegister(instance: any): void {
		if (instance?.__) {
			delete this.__instance[instance.__];
		}
	}
	default(config: ConfigObject = {}) {
		this.__config = { ...this.__config, ...config };
	}
	config(key: string = ''): any {
		const conf: ConfigObject = {};
		for (let name in this.__config) {
			if (name.indexOf(key + '.') !== 0) {
				continue;
			}
			conf[name.replace(key + '.', '')] = this.__config[name];
		}
		return conf;
	}
	history(fn: Function): any {
		if (!this.__history.current) {
			this.__history.current = HistoryStore(fn);
		}
		const store = this.__history.current();

		const [h, sh] = this.sm('APP').useState('history', {
			histories: store.histories,
			index: store.index,
		});

		useEffect(() => {
			sh({
				histories: store.histories,
				index: store?.index,
			});
		}, [store.histories, store.index]);

		useEffect(() => {
			store.init(h);
			this.sm('APP').active = true;
			return () => {
				this.sm('APP').remove('history');
			};
		}, []);

		return store;
	}
	sm(type: string): any {
		return Storage(type, this.smKey);
	}
	active(...args: any[]): void {
		this.isActive = true;
		this.emit('activated', ...args);
	}
	deActive(...args: any[]): void {
		this.isActive = false;
		this.emit('deactivated', ...args);
	}

	// Монтирование приложения
	mount(): void {
		appManager.mountRoot(this);
		this.active();
	}

	// Демонтирование приложения
	unMount(): void {
		this.deActive();
		appManager.unMountRoot(this);
	}
}
