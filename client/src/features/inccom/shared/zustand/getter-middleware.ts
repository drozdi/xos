import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand';

function shallowEqual(objA: any, objB: any): boolean {
	if (objA === objB) {
		return true;
	}

	if (
		typeof objA !== 'object' ||
		objA === null ||
		typeof objB !== 'object' ||
		objB === null
	) {
		return false;
	}

	const keysA = Object.keys(objA);
	const keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (let i = 0; i < keysA.length; i++) {
		if (objA[keysA[i]] !== objB[keysA[i]]) {
			return false;
		}
	}

	return true;
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
	const result = { ...target };
	for (const key in source) {
		if (
			source[key] &&
			typeof source[key] === 'object' &&
			!Array.isArray(source[key])
		) {
			result[key] = deepMerge((target as any)[key] || {}, source[key] as any);
		} else if (source[key] !== undefined) {
			result[key] = source[key] as any;
		}
	}
	const descriptors = Object.getOwnPropertyDescriptors(target);
	for (const [key, descriptor] of Object.entries(descriptors)) {
		if (descriptor.get && !(key in source)) {
			Object.defineProperty(result, key, descriptor);
		}
	}
	return result;
}

export function getterZustandMiddleware<
	T extends object,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(config: StateCreator<T, Mps, Mcs>): StateCreator<T, Mps, Mcs> {
	return (set, get, api) => {
		const customSet: StoreApi<T>['setState'] = (partial, replace) => {
			if (typeof partial === 'function') {
				const newPartial = partial(get());
				const mergedState = deepMerge(get(), newPartial);
				if (!shallowEqual(mergedState, get())) {
					set(mergedState, true);
				}
			} else if (partial !== null && typeof partial === 'object') {
				const mergedState = deepMerge(get(), partial);
				if (!shallowEqual(mergedState, get())) {
					set(mergedState, true);
				}
			} else {
				set(partial, replace);
			}
		};

		return config(customSet, get, api);
	};
}
