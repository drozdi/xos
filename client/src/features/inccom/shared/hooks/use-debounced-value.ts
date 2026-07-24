import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, wait: number): [T] {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), wait);
		return () => clearTimeout(timer);
	}, [value, wait]);

	return [debounced];
}
