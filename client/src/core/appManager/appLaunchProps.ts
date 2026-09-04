export function asPositiveInt(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === 'string' && /^\d+$/.test(value)) {
		const parsed = Number(value);
		return parsed > 0 ? parsed : null;
	}
	return null;
}

export function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}
