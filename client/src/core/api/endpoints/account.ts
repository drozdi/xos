import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type { AccountDetail, AccountUpdateRequest } from '@/types/api.types';

const PATHS = {
	account: '/api/account',
	map: '/api/account/map',
	accesses: '/api/account/accesses',
	roles: '/api/account/roles',
	options: '/api/account/options',
} as const;

export const accountEndpoints = PATHS;

export const accountDetailSchema = z.object({
	id: z.number(),
	email: z.string().nullable(),
	alias: z.string().nullable(),
	second_name: z.string().nullable(),
	first_name: z.string().nullable(),
	patronymic: z.string().nullable(),
	description: z.string().nullable(),
	date_register: z.string().nullable(),
	tutor: z.string(),
	last_login: z.string().nullable(),
	x_timestamp: z.string().nullable(),
});

export const accountMapSchema = z.record(z.string(), z.record(z.string(), z.unknown()));

export const accountAccessesSchema = z.record(z.string(), z.number());

export const accountRolesSchema = z.array(z.string());

export const accountOptionsSchema = z.record(z.string(), z.unknown());

export const accountUpdateRequestSchema = z.object({
	email: z.string().nullable().optional(),
	alias: z.string().optional(),
	second_name: z.string().optional(),
	first_name: z.string().optional(),
	patronymic: z.string().optional(),
	description: z.string().optional(),
	old_password: z.string().optional(),
	password: z.string().optional(),
	confirm_password: z.string().optional(),
});

export const accountUpdateResponseSchema = z.number();

export async function getAccount(): Promise<AccountDetail> {
	const { data } = await apiClient.get<unknown>(PATHS.account);
	return accountDetailSchema.parse(data);
}

export async function getAccesses(): Promise<Record<string, number>> {
	const { data } = await apiClient.get<unknown>(PATHS.accesses);
	return accountAccessesSchema.parse(data);
}

export async function getRoles(): Promise<string[]> {
	const { data } = await apiClient.get<unknown>(PATHS.roles);
	return accountRolesSchema.parse(data);
}

export async function getOptions(): Promise<Record<string, unknown>> {
	const { data } = await apiClient.get<unknown>(PATHS.options);
	return accountOptionsSchema.parse(data);
}

export async function getAccountMap(): Promise<Record<string, Record<string, unknown>>> {
	const { data } = await apiClient.get<unknown>(PATHS.map);
	return accountMapSchema.parse(data);
}

export async function updateAccount(data: AccountUpdateRequest): Promise<number> {
	const payload = accountUpdateRequestSchema.parse(data);
	const { data: response } = await apiClient.put<unknown>(PATHS.account, payload);
	return accountUpdateResponseSchema.parse(response);
}
