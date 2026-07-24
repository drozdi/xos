import { useEffect, useState } from 'react';

/** SSR-safe media query hook (replaces @mantine/hooks useMediaQuery). */
export function useMediaQuery(query: string, initialValue = false): boolean {
	const [matches, setMatches] = useState(initialValue);

	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return;
		}
		const mql = window.matchMedia(query);
		const onChange = () => setMatches(mql.matches);
		onChange();
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, [query]);

	return matches;
}
