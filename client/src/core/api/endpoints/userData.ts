import { z } from 'zod';

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

let snapshot: Map<string, UserAppDataDto> | null = null;
let snapshotLoading: Promise<Map<string, UserAppDataDto>> | null = null;

async function fetchList(prefix?: string): Promise<UserAppDataDto[]> {
	const { data } = await apiClient.get<unknown>(PATHS.all, {
		params: prefix ? { prefix } : undefined,
	});
	return userAppDataListResponseSchema.parse(data).items;
}

/** One list() per session; later reads (getOptional included) reuse it. */
async function loadSnapshot(): Promise<Map<string, UserAppDataDto>> {
	if (snapshot) {
		return snapshot;
	}
	if (!snapshotLoading) {
		snapshotLoading = fetchList()
			.then((items) => {
				snapshot = new Map(items.map((item) => [item.code, item]));
				return snapshot;
			})
			.finally(() => {
				snapshotLoading = null;
			});
	}
	return snapshotLoading;
}

export function resetUserDataCache(): void {
	snapshot = null;
	snapshotLoading = null;
}

export async function list(prefix?: string): Promise<UserAppDataDto[]> {
	const map = await loadSnapshot();
	const items = [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
	if (!prefix) {
		return items;
	}
	return items.filter((item) => item.code.startsWith(prefix));
}

export async function get(code: string): Promise<UserAppDataDto> {
	const { data } = await apiClient.get<unknown>(PATHS.one(code));
	return userAppDataDtoSchema.parse(data);
}

/**
 * Returns null when the key was never saved.
 * Uses the session list snapshot (one GET /api/user-data) so optional
 * prefs like widget.reminders never show as missing-resource errors.
 */
export async function getOptional(code: string): Promise<UserAppDataDto | null> {
	const map = await loadSnapshot();
	return map.get(code) ?? null;
}

export async function upsert(payload: UserAppDataUpsertRequest): Promise<UserAppDataDto> {
	const { data } = await apiClient.put<unknown>(PATHS.all, payload);
	const dto = userAppDataDtoSchema.parse(data);
	try {
		(await loadSnapshot()).set(dto.code, dto);
	} catch {
		snapshot = null;
	}
	return dto;
}

/** Named `deleteUserData` — `delete` is a reserved word. */
export async function deleteUserData(code: string): Promise<void> {
	await apiClient.delete(PATHS.one(code));
	try {
		(await loadSnapshot()).delete(code);
	} catch {
		snapshot = null;
	}
}

/** ADR surface: list / get / upsert / delete */
export const userDataApi = {
	list,
	get,
	getOptional,
	upsert,
	delete: deleteUserData,
} as const;
