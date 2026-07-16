/** Polyfill for deps (react-draggable) that read process.env in the browser. */
if (typeof globalThis.process === 'undefined') {
	Object.defineProperty(globalThis, 'process', {
		value: { env: {} as Record<string, string | undefined> },
		writable: true,
		configurable: true,
	});
} else if (!globalThis.process.env) {
	globalThis.process.env = {} as Record<string, string | undefined>;
}
