export interface ParsedFiscalQr {
	fn?: string;
	fpd?: string;
	fp?: string;
	fd?: string;
	amount?: string;
	date?: string;
}

function parseFiscalDate(value: string): string | undefined {
	const compact = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/.exec(
		value,
	);
	if (compact) {
		const [, year, month, day, hour, minute, second] = compact;
		const date = new Date(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			second ? Number(second) : 0,
		);
		if (!Number.isNaN(date.getTime())) {
			return date.toISOString();
		}
	}

	if (/^\d{10,13}$/.test(value)) {
		const numeric = Number(value);
		const ms = value.length === 13 ? numeric : numeric * 1000;
		const date = new Date(ms);
		if (!Number.isNaN(date.getTime())) {
			return date.toISOString();
		}
	}

	const parsed = Date.parse(value);
	if (!Number.isNaN(parsed)) {
		return new Date(parsed).toISOString();
	}

	return undefined;
}

function parseAmount(value: string): string | undefined {
	const normalized = value.replace(',', '.').trim();
	if (!normalized) {
		return undefined;
	}

	const amount = Number(normalized);
	if (Number.isNaN(amount)) {
		return undefined;
	}

	if (!normalized.includes('.') && amount >= 100) {
		return (amount / 100).toFixed(2);
	}

	return amount.toFixed(2);
}

function parseKeyValuePairs(raw: string): Record<string, string> {
	const query = raw.includes('?') ? (raw.split('?').pop() ?? raw) : raw;
	const pairs: Record<string, string> = {};

	for (const part of query.split('&')) {
		if (!part) {
			continue;
		}

		const separatorIndex = part.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = part.slice(0, separatorIndex).trim();
		const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
		if (key) {
			pairs[key] = value;
		}
	}

	return pairs;
}

export function parseFiscalQr(raw: string): ParsedFiscalQr {
	const result: ParsedFiscalQr = {};

	if (!raw?.trim()) {
		return result;
	}

	const params = parseKeyValuePairs(raw.trim());
	if (Object.keys(params).length === 0) {
		return result;
	}

	if (params['fn']) {
		result.fn = params['fn'];
	}

	if (params['fpd']) {
		result.fpd = params['fpd'];
	} else if (params['fp']) {
		result.fp = params['fp'];
	}

	if (params['fd']) {
		result.fd = params['fd'];
	} else if (params['i']) {
		result.fd = params['i'];
	}

	if (params['s']) {
		const amount = parseAmount(params['s']);
		if (amount) {
			result.amount = amount;
		}
	}

	if (params['t']) {
		const date = parseFiscalDate(params['t']);
		if (date) {
			result.date = date;
		}
	}

	return result;
}
