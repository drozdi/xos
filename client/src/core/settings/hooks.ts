import { useCallback, useEffect, useRef, useState } from 'react';

import type { SettingCategory } from './adapters/ISettingAdapter';
import { settingManager } from './SettingManager';

function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delay: number): T {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(
		() => () => {
			if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
		},
		[],
	);

	return useCallback(
		((...args: Parameters<T>) => {
			if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		}) as T,
		[delay],
	);
}

export function useSetting<T>(
	category: SettingCategory,
	key: string,
	defaultValue?: T,
): [T | undefined, (value: T) => void, boolean] {
	const [value, setValueState] = useState<T | undefined>(defaultValue);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let active = true;

		void (async () => {
			setIsLoading(true);
			if (!settingManager.isInitialized()) {
				return;
			}
			const stored = (await settingManager.get(category, key)) as T | undefined;
			if (!active) {return;}
			const resolved = stored ?? defaultValue;
			setValueState((current) => (Object.is(current, resolved) ? current : resolved));
			setIsLoading(false);
		})();

		return () => {
			active = false;
		};
	}, [category, key, defaultValue]);

	useEffect(() => {
		return settingManager.subscribe((changedCategory, changedKey) => {
			if (!settingManager.isInitialized()) {
				return;
			}
			if (changedCategory === category && changedKey === key) {
				void settingManager.get(category, key).then((next) => {
					const resolved = (next ?? defaultValue) as T | undefined;
					setValueState((current) => (Object.is(current, resolved) ? current : resolved));
				});
			}
		});
	}, [category, key, defaultValue]);

	const setValue = useCallback(
		(next: T) => {
			let changed = false;
			setValueState((current) => {
				if (Object.is(current, next)) {
					return current;
				}
				changed = true;
				return next;
			});
			if (changed) {
				void settingManager.set(category, key, next);
			}
		},
		[category, key],
	);

	return [value, setValue, isLoading];
}

export function useSetState<T>(
	category: SettingCategory,
	key: string,
	initial: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
	const [value, setValueState] = useState<T>(initial);
	const [isLoading, setIsLoading] = useState(true);
	const valueRef = useRef(value);

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	useEffect(() => {
		let active = true;

		void (async () => {
			setIsLoading(true);
			if (!settingManager.isInitialized()) {
				return;
			}
			const stored = (await settingManager.get(category, key)) as T | undefined;
			if (!active) {return;}
			const resolved = stored ?? initial;
			setValueState((current) => (Object.is(current, resolved) ? current : resolved));
			setIsLoading(false);
		})();

		return () => {
			active = false;
		};
	}, [category, key, initial]);

	useEffect(() => {
		return settingManager.subscribe((changedCategory, changedKey) => {
			if (!settingManager.isInitialized()) {
				return;
			}
			if (changedCategory === category && changedKey === key) {
				void settingManager.get(category, key).then((next) => {
					const resolved = (next ?? initial) as T;
					setValueState((current) => (Object.is(current, resolved) ? current : resolved));
				});
			}
		});
	}, [category, key, initial]);

	const persist = useDebouncedCallback((next: T) => {
		void settingManager.set(category, key, next);
	}, 300);

	const setValue = useCallback(
		(next: T | ((prev: T) => T)) => {
			const resolved =
				typeof next === 'function' ? (next as (p: T) => T)(valueRef.current) : next;
			if (Object.is(valueRef.current, resolved)) {
				return;
			}
			valueRef.current = resolved;
			setValueState(resolved);
			persist(resolved);
		},
		[persist],
	);

	return [value, setValue, isLoading];
}
