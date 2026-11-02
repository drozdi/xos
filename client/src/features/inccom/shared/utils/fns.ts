export function minMax(val: number, min?: number, max?: number) {
	const _min = typeof min === 'number' && !isNaN(min)
	const _max = typeof max === 'number' && !isNaN(max)
	return _min && val < min && min > 0 ? min : _max && val > max && max > 0 ? max : val
}
