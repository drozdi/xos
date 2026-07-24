import { useEffect, useState } from 'react';

/** Подписка на `window.matchMedia` (замена `@mantine/hooks`). */
export function useMediaQuery(query: string, defaultValue = false): boolean {
	const [matches, setMatches] = useState(defaultValue);

	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return undefined;
		}
		const media = window.matchMedia(query);
		const update = () => setMatches(media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, [query]);

	return matches;
}
