function getTag(value) {
	if (value == null) {
		return value === undefined ? '[object Undefined]' : '[object Null]';
	}
	return toString.call(value);
}
export function isFunction(func) {
	return (
		typeof func === 'function' ||
		Object.prototype.toString.call(func) === '[object Function]'
	);
}
export function isNumber(val) {
	return typeof val === 'number' && !Number.isNaN(val);
}
export function isString(val) {
	return typeof val === 'string';
}
export function isBoolean(val) {
	return typeof val === 'boolean' || val === true || val === false;
}
export function isArray(val) {
	return Array.isArray(val);
}
export function isObject(obj) {
	return obj !== null && typeof obj === 'object' && !!obj;
}
export function isEmptyObject(val) {
	return isObject(val) && Object.values(val).length === 0;
}
export function isUndefined(val) {
	return typeof val === 'undefined';
}
export function isNull(val) {
	return val === null;
}
export function isNullOrUndefined(val) {
	return isNull(val) || isUndefined(val);
}
export function isHTMLElement(val) {
	return val instanceof HTMLElement;
}
export function isFieldElement(el) {
	return (
		el instanceof HTMLInputElement ||
		el instanceof HTMLTextAreaElement ||
		el instanceof HTMLSelectElement
	);
}
export function isFocusVisible(el) {
	try {
		return el.matches(':focus-visible');
	} catch (error) {
		// Do not warn on jsdom tests, otherwise all tests that rely on focus have to be skipped
		// Tests that rely on `:focus-visible` will still have to be skipped in jsdom
		if (
			process.env.NODE_ENV !== 'production' &&
			!/jsdom/.test(window.navigator.userAgent)
		) {
			console.warn(
				[
					'MUI: The `:focus-visible` pseudo class is not supported in this browser.',
					'Some components rely on this feature to work properly.',
				].join('\n'),
			);
		}
	}

	return false;
}
export function isRadioInput(el) {
	return isFieldElement(el) && el?.type === 'radio';
}
export function isCheckBoxInput(el) {
	return isFieldElement(el) && el?.type === 'checkbox';
}
export function isRadioOrCheckboxInput(el) {
	return isRadioInput(el) || isCheckBoxInput(el);
}
export function isEmpty(val) {
	return (
		val === '' ||
		val === null ||
		val === undefined ||
		isEmptyObject(val) ||
		(isArray(val) && val.length === 0)
	);
}
export function isRegex(val) {
	return val instanceof RegExp;
}
export function isObjectType(val) {
	return typeof val === 'object';
}
export function isPrimitive(val) {
	return isNullOrUndefined(val) || !isObjectType(val);
}
export function isDateObject(val) {
	return val instanceof Date;
}
export function isSymbol(val) {
	const type = typeof val;
	return (
		type === 'symbol' ||
		(type === 'object' && val != null && getTag(val) === '[object Symbol]')
	);
}
