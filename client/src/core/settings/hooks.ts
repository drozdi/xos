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
			const stored = (await settingManager.get(category, key)) as T | undefined;
			if (!active) {return;}
			setValueState(stored ?? defaultValue);
			setIsLoading(false);
		})();

		return () => {
			active = false;
		};
	}, [category, key, defaultValue]);

	useEffect(() => {
		return settingManager.subscribe((changedCategory, changedKey) => {
			if (changedCategory === category && changedKey === key) {
				void settingManager.get(category, key).then((next) => {
					setValueState((next ?? defaultValue) as T | undefined);
				});
			}
		});
	}, [category, key, defaultValue]);

	const setValue = useCallback(
		(next: T) => {
			setValueState(next);
			void settingManager.set(category, key, next);
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
			const stored = (await settingManager.get(category, key)) as T | undefined;
			if (!active) {return;}
			setValueState(stored ?? initial);
			setIsLoading(false);
		})();

		return () => {
			active = false;
		};
	}, [category, key, initial]);

	useEffect(() => {
		return settingManager.subscribe((changedCategory, changedKey) => {
			if (changedCategory === category && changedKey === key) {
				void settingManager.get(category, key).then((next) => {
					setValueState((next ?? initial) as T);
				});
			}
		});
	}, [category, key, initial]);

	const persist = useDebouncedCallback((next: T) => {
		void settingManager.set(category, key, next);
	}, 300);

	const setValue = useCallback(
		(next: T | ((prev: T) => T)) => {
			setValueState((prev) => {
				const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
				valueRef.current = resolved;
				persist(resolved);
				return resolved;
			});
		},
		[category, key, persist],
	);

	return [value, setValue, isLoading];
}
