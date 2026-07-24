import { useCallback, useEffect, useRef } from 'react';

export function useInterval(fn: () => void, interval: number) {
	const fnRef = useRef(fn);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		fnRef.current = fn;
	}, [fn]);

	const stop = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const start = useCallback(() => {
		stop();
		if (interval <= 0) {
			return;
		}
		timerRef.current = setInterval(() => fnRef.current(), interval);
	}, [interval, stop]);

	useEffect(() => () => stop(), [stop]);

	return { start, stop, active: timerRef.current !== null };
}
