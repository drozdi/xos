import { cached } from './cached'

/**
 * Hyphenate a camelCase string.
 */
export const hyphenate = cached<string>((str: string) => {
	return str
		.replace(/[A-Z]/g, (c) => {
			return `-${  c.toLowerCase()}`
		})
		.toLowerCase()
})

/**
 * Camelize a hyphen-delimited string.
 */
export const camelize = cached<string>((str: string): string => {
	return str.replace(/-(\w)/g, (_, c) => {
		return c ? c.toUpperCase() : ''
	})
})

/**
 * Capitalize a string.
 */
export const capitalize = cached<string>((str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1)
})
