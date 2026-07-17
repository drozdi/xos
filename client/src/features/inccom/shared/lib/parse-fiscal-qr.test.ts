import { describe, expect, it } from 'vitest';

import { parseFiscalQr } from './parse-fiscal-qr';

describe('parseFiscalQr', () => {
	it('parses empty string to empty object', () => {
		expect(parseFiscalQr('')).toEqual({});
		expect(parseFiscalQr('   ')).toEqual({});
	});

	it('parses sample fiscal QR payload', () => {
		const result = parseFiscalQr(
			't=20260201T1430&s=125050&fn=72890000&fp=1234567890&i=12345',
		);

		expect(result.fn).toBe('72890000');
		expect(result.fp).toBe('1234567890');
		expect(result.fd).toBe('12345');
		expect(result.amount).toBe('1250.50');
		expect(result.date).toBeDefined();
		expect(result.date).toMatch(/^2026-02-01T\d{2}:30:00/);
	});

	it('parses amount in kopecks when no decimal separator', () => {
		const result = parseFiscalQr('s=125050');

		expect(result.amount).toBe('1250.50');
	});

	it('parses decimal amount as-is', () => {
		const result = parseFiscalQr('s=99.50');

		expect(result.amount).toBe('99.50');
	});

	it('returns empty object for invalid input', () => {
		expect(parseFiscalQr('not-a-valid-qr')).toEqual({});
		expect(parseFiscalQr('???')).toEqual({});
	});
});
