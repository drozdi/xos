import { isFunction } from './is.js';

export function getComputedSize($el, def = [0, 0]) {
	if (!$el) {
		return def;
	}
	if (!$el.nodeType) {
		$el = document.querySelector($el);
	}
	const style = window.getComputedStyle($el);
	return [
		parseFloat(style.getPropertyValue('width') || 0, 10),
		parseFloat(style.getPropertyValue('height') || 0, 10),
	];
}
export function getComputedStyle($el) {
	if (!$el) {
		return {};
	}
	if (!$el.nodeType) {
		$el = document.querySelector($el);
	}
	return window.getComputedStyle($el);
}

export function matchesSelectorToParentElements(el, selector, baseNode) {
	let node = el;

	const matchesSelectorFunc = [
		'matches',
		'webkitMatchesSelector',
		'mozMatchesSelector',
		'msMatchesSelector',
		'oMatchesSelector',
	].find((func) => isFunction(node[func]));
	if (!isFunction(node[matchesSelectorFunc])) {
		return false;
	}

	do {
		if (
			isFunction(node[matchesSelectorFunc]) &&
			node[matchesSelectorFunc](selector)
		) {
			return true;
		}
		if (node === baseNode) {
			return false;
		}
		node = node.parentNode;
	} while (node);

	return false;
}
