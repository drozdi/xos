import { describe, expect, it } from 'vitest';

import {
	loginCheckResponseSchema,
	loginRequestSchema,
	loginResponseSchema,
	logoutResponseSchema,
	refreshResponseSchema,
	userSummarySchema,
} from '@/core/api/endpoints/auth';

describe('auth endpoints schemas', () => {
	describe('loginRequestSchema', () => {
		it('accepts valid credentials', () => {
			const payload = loginRequestSchema.parse({
				username: 'admin',
				password: 'secret',
			});

			expect(payload.username).toBe('admin');
		});

		it('rejects empty username or password', () => {
			expect(() => loginRequestSchema.parse({ username: '', password: 'x' })).toThrow();
			expect(() => loginRequestSchema.parse({ username: 'x', password: '' })).toThrow();
		});
	});

	describe('userSummarySchema', () => {
		it('parses full LoginSuccessHandler user payload', () => {
			const user = userSummarySchema.parse({
				id: 1,
				login: 'admin',
				email: 'admin@example.com',
				alias: 'Administrator',
				roles: ['ROLE_ADMIN', 'ROLE_USER'],
				scopes: { 'app.read': 1, 'app.write': 2 },
			});

			expect(user.login).toBe('admin');
			expect(user.roles).toEqual(['ROLE_ADMIN', 'ROLE_USER']);
			expect(user.scopes?.['app.read']).toBe(1);
		});

		it('defaults roles to empty array when omitted', () => {
			const user = userSummarySchema.parse({
				id: 2,
				email: null,
			});

			expect(user.roles).toEqual([]);
		});

		it('accepts null alias and login from /api/user', () => {
			const user = userSummarySchema.parse({
				id: 4,
				email: null,
				login: null,
				alias: null,
				roles: ['ROLE_USER'],
			});

			expect(user.alias).toBeNull();
			expect(user.login).toBeNull();
		});
	});

	describe('loginResponseSchema', () => {
		it('parses Lexik-only response without user', () => {
			const response = loginResponseSchema.parse({
				token: 'access-token',
				refresh_token: 'refresh-token',
			});

			expect(response.token).toBe('access-token');
			expect(response.user).toBeUndefined();
		});

		it('parses LoginSuccessHandler response with embedded user', () => {
			const response = loginResponseSchema.parse({
				token: 'access-token',
				refresh_token: 'refresh-token',
				user: {
					id: 1,
					login: 'admin',
					alias: 'Admin',
					email: null,
					roles: ['ROLE_ADMIN'],
					scopes: { read: 1 },
				},
			});

			expect(response.user?.login).toBe('admin');
			expect(response.user?.roles).toContain('ROLE_ADMIN');
		});
	});

	describe('refreshResponseSchema', () => {
		it('parses token pair', () => {
			const response = refreshResponseSchema.parse({
				token: 'new-access',
				refresh_token: 'new-refresh',
			});

			expect(response.token).toBe('new-access');
		});
	});

	describe('loginCheckResponseSchema', () => {
		it('parses authenticated status', () => {
			expect(loginCheckResponseSchema.parse({ status: 'authenticated' }).status).toBe(
				'authenticated',
			);
		});
	});

	describe('logoutResponseSchema', () => {
		it('parses logged out status', () => {
			expect(logoutResponseSchema.parse({ status: 'logged_out' }).status).toBe('logged_out');
		});
	});
});
