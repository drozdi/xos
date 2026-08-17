import { z } from 'zod';
import axios, { type InternalAxiosRequestConfig } from 'axios';

import { apiClient } from '@/core/api/client';

export const userAppDataDtoSchema = z.object({
	code: z.string(),
	value: z.unknown(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const userAppDataListResponseSchema = z.object({
	items: z.array(userAppDataDtoSchema),
});

export type UserAppDataDto = z.infer<typeof userAppDataDtoSchema>;

export type UserAppDataUpsertRequest = {
	code: string;
	value: unknown;
};

const PATHS = {
	all: '/api/user-data',
	one: (code: string) => `/api/user-data/${encodeURIComponent(code)}`,
} as const;

export const userDataEndpoints = PATHS;

export async function list(prefix?: string): Promise<UserAppDataDto[]> {
	const { data } = await apiClient.get<unknown>(PATHS.all, {
		params: prefix ? { prefix } : undefined,
	});
	return userAppDataListResponseSchema.parse(data).items;
}

export async function get(code: string): Promise<UserAppDataDto> {
	const { data } = await apiClient.get<unknown>(PATHS.one(code));
	return userAppDataDtoSchema.parse(data);
}

/** Returns null when the key was never saved (404 is normal for optional prefs). */
export async function getOptional(code: string): Promise<UserAppDataDto | null> {
	try {
		const { data } = await apiClient.get<unknown>(PATHS.one(code), {
			_silent404: true,
		} as InternalAxiosRequestConfig);
		return userAppDataDtoSchema.parse(data);
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			return null;
		}
		throw error;
	}
}

export async function upsert(payload: UserAppDataUpsertRequest): Promise<UserAppDataDto> {
	const { data } = await apiClient.put<unknown>(PATHS.all, payload);
	return userAppDataDtoSchema.parse(data);
}

/** Named `deleteUserData` — `delete` is a reserved word. */
export async function deleteUserData(code: string): Promise<void> {
	await apiClient.delete(PATHS.one(code));
}

/** ADR surface: list / get / upsert / delete */
export const userDataApi = {
	list,
	get,
	getOptional,
	upsert,
	delete: deleteUserData,
} as const;
