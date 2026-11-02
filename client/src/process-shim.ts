/** Polyfill for deps (react-draggable) that read process.env in the browser. */
type ProcessGlobal = typeof globalThis & {
	process?: { env?: Record<string, string | undefined> };
};

const root = globalThis as ProcessGlobal;

if (typeof root.process === 'undefined') {
	Object.defineProperty(root, 'process', {
		value: { env: {} as Record<string, string | undefined> },
		writable: true,
		configurable: true,
	});
} else if (!root.process.env) {
	root.process.env = {} as Record<string, string | undefined>;
}
