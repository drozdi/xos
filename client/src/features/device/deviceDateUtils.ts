export function parseDeviceDate(value?: string | null): Date | null {
	if (!value?.trim()) {
		return null;
	}

	const dotted = value.trim().match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);
	if (dotted) {
		const [, year, month, day] = dotted;
		const parsed = new Date(Number(year), Number(month) - 1, Number(day));
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDeviceDate(value: Date | string | null): string {
	if (!value) {
		return '';
	}

	if (typeof value === 'string') {
		return value;
	}

	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, '0');
	const day = String(value.getDate()).padStart(2, '0');
	return `${year}.${month}.${day}`;
}
