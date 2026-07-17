export const BROWSER_HOME = 'about:home';

export function normalizeBrowserUrl(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed || trimmed === BROWSER_HOME) {
		return BROWSER_HOME;
	}

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	if (/^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?(\/|$)/i.test(trimmed)) {
		return `http://${trimmed}`;
	}

	if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/|$)/i.test(trimmed)) {
		return `https://${trimmed}`;
	}

	return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

export function getBrowserTitle(url: string): string {
	if (url === BROWSER_HOME) {
		return 'Браузер';
	}

	try {
		const parsed = new URL(url);
		return parsed.hostname || url;
	} catch {
		return url;
	}
}

export function getAddressValue(url: string): string {
	return url === BROWSER_HOME ? '' : url;
}
