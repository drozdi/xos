import { isString } from './is';
export function randomId(prefix = 'x-') {
	return `${prefix}${Math.random().toString(36).slice(2, 11)}`;
}

export function safeId(uid, errorMessage) {
	return (value) => {
		if (!isString(value) || value.trim().length === 0) {
			throw new Error(errorMessage);
		}

		return `${uid}-${value}`;
	};
}
