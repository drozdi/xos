// @ts-nocheck
function getTag(value: unknown) {
	if (value == null) {
		return value === undefined ? '[object Undefined]' : '[object Null]'
	}
	return Object.prototype.toString.call(value)
}
export function isFunction(func: unknown): boolean {
	return typeof func === 'function' || Object.prototype.toString.call(func) === '[object Function]'
}
export function isNumber(val: unknown): boolean {
	return typeof val === 'number' && !Number.isNaN(val)
}
export function isString(val: unknown): boolean {
	return typeof val === 'string'
}
export function isBoolean(val: unknown): boolean {
	return typeof val === 'boolean' || val === true || val === false
}
export function isArray(val: unknown): boolean {
	return Array.isArray(val)
}
export function isObject(obj: unknown): boolean {
	return obj !== null && typeof obj === 'object' && !!obj
}
export function isEmptyObject(val: unknown) {
	return isObject(val) && Object.values(val).length === 0
}
export function isUndefined(val: unknown) {
	return typeof val === 'undefined'
}
export function isNull(val: unknown) {
	return val === null
}
export function isNullOrUndefined(val: unknown) {
	return isNull(val) || isUndefined(val)
}
export function isHTMLElement(val: unknown) {
	return val instanceof HTMLElement
}
export function isFieldElement(el: unknown) {
	return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
}
export function isFocusVisible(el: unknown) {
	try {
		return el.matches(':focus-visible')
	} catch (error) {
		// Do not warn on jsdom tests, otherwise all tests that rely on focus have to be skipped
		// Tests that rely on `:focus-visible` will still have to be skipped in jsdom
		if (process.env.NODE_ENV !== 'production' && !/jsdom/.test(window.navigator.userAgent)) {
			console.warn(
				[
					'MUI: The `:focus-visible` pseudo class is not supported in this browser.',
					'Some components rely on this feature to work properly.',
				].join('\n')
			)
		}
	}

	return false
}
export function isRadioInput(el: unknown) {
	return isFieldElement(el) && el?.type === 'radio'
}
export function isCheckBoxInput(el: unknown) {
	return isFieldElement(el) && el?.type === 'checkbox'
}
export function isRadioOrCheckboxInput(el: unknown) {
	return isRadioInput(el) || isCheckBoxInput(el)
}
export function isEmpty(val: unknown) {
	return val === '' || val === null || val === undefined || isEmptyObject(val) || (isArray(val) && val.length === 0)
}
export function isRegex(val: unknown) {
	return val instanceof RegExp
}
export function isObjectType(val: unknown) {
	return typeof val === 'object'
}
export function isPrimitive(val: unknown) {
	return isNullOrUndefined(val) || !isObjectType(val)
}
export function isDateObject(val: unknown) {
	return val instanceof Date
}
export function isSymbol(val: unknown) {
	const type = typeof val
	return type === 'symbol' || (type === 'object' && val != null && getTag(val) === '[object Symbol]')
}

export function isSafari(): boolean {
	return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}
