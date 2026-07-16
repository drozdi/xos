export function buildColumnOrderIndex<T>(columnOrder: (keyof T)[]): Map<keyof T, number> {
	return new Map(columnOrder.map((field, index) => [field, index]));
}

export function compareByColumnOrder<T>(
	a: keyof T,
	b: keyof T,
	orderIndex: Map<keyof T, number>,
): number {
	return (orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER);
}
