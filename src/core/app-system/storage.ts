import { useSetState } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { cached } from '../../utils/cached';
import { settingManager } from '../setting-system/setting-manager';

export const Storage = cached(function StorageFn(type: string, key: string) {
	let smActive = false;
	let sm = {
		set(key: string, val: any): any {
			return val;
		},
		get(key: string, def: any, type = null): any {
			return def;
		},
		remove(key: string | null): void {},
	};

	if (settingManager[type] && key) {
		sm = settingManager[type].sub(key);
	} else if (key === 'core') {
		sm = settingManager['APP'].sub(key);
	}

	/*useEffect(() => {
		smActive = true;
		return () => sm.remove();
	}, []);*/

	return {
		type,
		key,
		get active() {
			return smActive;
		},
		set active(val) {
			smActive = val;
		},
		set(key: string, val: any): any {
			smActive && sm.set(key, val);
			return val;
		},
		get(key: string, val: any, type = null): any {
			return sm.get(key, val, type);
		},
		remove(key: string | null): void {
			smActive && sm.remove(key);
		},
		save(fn: Function = () => {}, ...args: any[]) {
			let old = smActive;
			smActive = true;
			fn(...args);
			smActive = old;
		},
		no(fn: Function = () => {}, ...args: any[]) {
			let old = smActive;
			smActive = false;
			fn(...args);
			smActive = old;
		},
		first(fn: Function = () => {}, ...args: any[]) {
			let first = this.get('.first', true);
			if (first) {
				fn(...args);
			}
			this.set('.first', false);
		},
		useState<T>(name: string, initial?: T): [T, Function] {
			const [state, setState] = useState<T>(this.get(name, initial));
			useEffect(() => {
				this.set(name, state);
			}, [state, name]);
			return [state as T, setState];
		},
		useSetState<T extends Record<string, any>>(
			name: string,
			initial?: T,
		): [T, Function] {
			const [state, updateState] = useSetState<T>(this.get(name, initial));
			useEffect(() => {
				this.set(name, state);
			}, [state, name]);
			return [state as T, updateState];
		},
		useStateProxy(name: string, initial: Record<string, any>): any {
			const [state, dispatch] = useState(this.get(name, initial));
			useEffect(() => {
				this.set(name, state);
			}, [state, name]);
			return new Proxy(state, {
				get(target, property) {
					if (property in target) {
						return target[property];
					}
					return undefined;
				},
				set(target, property, value) {
					dispatch((v: Record<string, any>) => ({ ...v, [property]: value }));
					target[property] = value;
					return true;
				},
				has(target, property) {
					return property in target;
				},
				ownKeys(target) {
					return Object.keys(target);
				},
				deleteProperty(target, property) {
					dispatch((v: Record<string, any>) => ({
						...v,
						[property]: undefined,
					}));
					delete target[property];
					return true;
				},
			});
		},
	};
});
