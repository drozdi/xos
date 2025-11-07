export function minMax(val, min, max) {
	let _min = typeof min === 'number' && !isNaN(min);
	let _max = typeof max === 'number' && !isNaN(max);
	return _min && val < min && min > 0 ? min : _max && val > max && max > 0 ? max : val;
}
