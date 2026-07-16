import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type {
	LoginCheckResponse,
	LoginRequest,
	LoginResponse,
	LogoutResponse,
	RefreshResponse,
	UserSummary,
} from '@/types/api.types';

const PATHS = {
	login: '/api/login',
	logout: '/api/logout',
	refresh: '/api/token/refresh',
	loginCheck: '/api/login-check',
	user: '/api/user',
} as const;

export const authEndpoints = PATHS;

export const loginRequestSchema = z.object({
	username: z.string().min(1, 'Введите логин'),
	password: z.string().min(1, 'Введите пароль'),
});

export const userSummarySchema = z.object({
	id: z.number(),
	email: z.string().nullable().default(null),
	login: z.string().nullish(),
	alias: z.string().nullish(),
	roles: z.array(z.string()).default([]),
	scopes: z.record(z.string(), z.number()).optional(),
});

export const loginResponseSchema = z.object({
	token: z.string(),
	refresh_token: z.string(),
	user: userSummarySchema.optional(),
});

export const refreshResponseSchema = z.object({
	token: z.string(),
	refresh_token: z.string(),
});

export const loginCheckResponseSchema = z.object({
	status: z.string(),
});

export const logoutResponseSchema = z.object({
	status: z.string(),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type UserSummaryDto = z.infer<typeof userSummarySchema>;

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
	const { data } = await apiClient.post<unknown>(PATHS.login, credentials);
	return loginResponseSchema.parse(data);
}

export async function refreshToken(refresh_token: string): Promise<RefreshResponse> {
	const { data } = await apiClient.post<unknown>(PATHS.refresh, { refresh_token });
	return refreshResponseSchema.parse(data);
}

export async function logout(): Promise<LogoutResponse> {
	const { data } = await apiClient.get<unknown>(PATHS.logout);
	return logoutResponseSchema.parse(data);
}

export async function loginCheck(): Promise<LoginCheckResponse> {
	const { data } = await apiClient.get<unknown>(PATHS.loginCheck);
	return loginCheckResponseSchema.parse(data);
}

export async function getUser(): Promise<UserSummary> {
	const { data } = await apiClient.get<unknown>(PATHS.user);
	return userSummarySchema.parse(data);
}
