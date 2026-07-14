import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type {
	SettingCategory,
	SettingsBatchRequest,
	UserSettingDto,
} from '@/types/api.types';

const settingCategorySchema = z.enum(['USER', 'APP', 'WIN', 'HKEY_CONFIG']);

export const userSettingDtoSchema = z.object({
	category: settingCategorySchema,
	key: z.string(),
	value: z.unknown(),
	updatedAt: z.string().optional(),
});

export const settingsListResponseSchema = z.object({
	items: z.array(userSettingDtoSchema),
});

export const settingsUpsertResponseSchema = z.union([
	userSettingDtoSchema,
	z.object({ items: z.array(userSettingDtoSchema) }),
]);

const PATHS = {
	all: '/api/settings',
	one: (category: SettingCategory, key: string) =>
		`/api/settings/${category}/${encodeURIComponent(key)}`,
} as const;

export const settingsEndpoints = PATHS;

export async function getAllSettings(category?: SettingCategory): Promise<UserSettingDto[]> {
	const { data } = await apiClient.get<unknown>(PATHS.all, {
		params: category ? { category } : undefined,
	});
	return settingsListResponseSchema.parse(data).items;
}

export async function getSetting(
	category: SettingCategory,
	key: string,
): Promise<UserSettingDto | null> {
	try {
		const { data } = await apiClient.get<unknown>(PATHS.one(category, key));
		return userSettingDtoSchema.parse(data);
	} catch (error) {
		if (isNotFoundError(error)) {return null;}
		throw error;
	}
}

export async function upsertSetting(
	category: SettingCategory,
	key: string,
	value: unknown,
): Promise<UserSettingDto> {
	const { data } = await apiClient.post<unknown>(PATHS.all, { category, key, value });
	const parsed = settingsUpsertResponseSchema.parse(data);
	return Array.isArray((parsed as { items?: UserSettingDto[] }).items)
		? (parsed as { items: UserSettingDto[] }).items[0]!
		: (parsed as UserSettingDto);
}

export async function upsertSettingsBatch(
	request: SettingsBatchRequest,
): Promise<UserSettingDto[]> {
	const { data } = await apiClient.post<unknown>(PATHS.all, request);
	const parsed = settingsUpsertResponseSchema.parse(data);
	if ('items' in parsed && Array.isArray(parsed.items)) {
		return parsed.items;
	}
	return [parsed as UserSettingDto];
}

export async function deleteSetting(category: SettingCategory, key: string): Promise<void> {
	await apiClient.delete(PATHS.one(category, key));
}

function isNotFoundError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'response' in error &&
		typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
		(error as { response: { status: number } }).response.status === 404
	);
}
