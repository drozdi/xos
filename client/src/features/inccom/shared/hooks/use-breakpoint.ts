import { useMediaQuery } from './use-media-query';

const BREAKPOINTS: Record<string, string> = {
	xs: '36em',
	sm: '48em',
	md: '62em',
	lg: '75em',
	xl: '88em',
};

export function useBreakpoint(size: string = 'xs') {
	const width = BREAKPOINTS[size] ?? size;
	return useMediaQuery(`(max-width: ${width})`);
}
