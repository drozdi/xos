import { describe, expect, it } from 'vitest';

import {
	accountUpdateRequestSchema,
	accountUpdateResponseSchema,
} from '@/core/api/endpoints/account';

describe('account endpoints', () => {
	describe('accountUpdateRequestSchema', () => {
		it('accepts profile fields without password', () => {
			const payload = accountUpdateRequestSchema.parse({
				email: 'user@example.com',
				alias: 'User',
				first_name: 'Иван',
				second_name: 'Иванов',
				patronymic: 'Иванович',
				description: 'Bio',
			});

			expect(payload.alias).toBe('User');
		});

		it('accepts optional password fields', () => {
			const payload = accountUpdateRequestSchema.parse({
				alias: 'User',
				old_password: 'old-secret',
				password: 'secret',
				confirm_password: 'secret',
			});

			expect(payload.old_password).toBe('old-secret');
			expect(payload.password).toBe('secret');
		});
	});

	describe('accountUpdateResponseSchema', () => {
		it('parses numeric user id response', () => {
			expect(accountUpdateResponseSchema.parse(1)).toBe(1);
		});
	});
});
