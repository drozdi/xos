export * from './store';
export * from './window-manager';
export let zIndex = 100;
export function setZIndex(val) {
	if (val > zIndex) {
		zIndex = val;
	}
}
