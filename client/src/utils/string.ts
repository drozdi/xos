import { cached } from './cached';

/**
 * Hyphenate a camelCase string.
 */
export const hyphenate = cached<string>(function (str: string) {
	return str
		.replace(/[A-Z]/, function (c) {
			return '-' + c.toLowerCase();
		})
		.toLowerCase();
});
/**
 * Camelize a hyphen-delimited string.
 */
export const camelize = cached<string>(function (str: string) {
	return str.replace(/-(\w)/g, function (_, c) {
		return c ? c.toUpperCase() : '';
	});
});
/**
 * Capitalize a string.
 */
export const capitalize = cached<string>(function (str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
});
