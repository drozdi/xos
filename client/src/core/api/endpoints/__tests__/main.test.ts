import { describe, expect, it } from 'vitest';

import {
	parseContentRange,
	userListItemSchema,
	userListResponseSchema,
} from '@/core/api/endpoints/main';

describe('main endpoints', () => {
	describe('parseContentRange', () => {
		it('parses total from Content-Range header', () => {
			expect(parseContentRange('items 0-19/42')).toBe(42);
			expect(parseContentRange('items 20-39/100')).toBe(100);
		});

		it('returns 0 for missing or invalid header', () => {
			expect(parseContentRange(undefined)).toBe(0);
			expect(parseContentRange('invalid')).toBe(0);
		});
	});

	describe('user list schemas', () => {
		it('parses list item', () => {
			const item = userListItemSchema.parse({
				id: 1,
				login: 'admin',
				alias: 'Admin',
				ou: '1',
				tutor: 'mentor',
			});

			expect(item.login).toBe('admin');
		});

		it('parses list response array', () => {
			const items = userListResponseSchema.parse([
				{ id: 1, login: 'a', alias: 'A', ou: '1', tutor: '' },
				{ id: 2, login: 'b', alias: 'B', ou: '2', tutor: 't' },
			]);

			expect(items).toHaveLength(2);
		});
	});
});
