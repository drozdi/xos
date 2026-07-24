import { useCallback, useState } from 'react';

type PartialState<T extends object> =
	| Partial<T>
	| ((currentState: T) => Partial<T>);

/** Partial object state updater (replaces @mantine/hooks useSetState). */
export function useSetState<T extends object>(
	initial: T,
): [T, (patch: PartialState<T>) => void] {
	const [state, setState] = useState(initial);

	const update = useCallback((patch: PartialState<T>) => {
		setState((current) => {
			const next = typeof patch === 'function' ? patch(current) : patch;
			return { ...current, ...next };
		});
	}, []);

	return [state, update];
}
