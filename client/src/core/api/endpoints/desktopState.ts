import { z } from 'zod';

import { apiClient } from '@/core/api/client';

import { userSettingDtoSchema } from './settings';

export const desktopStateExplorerLastPathSchema = z.object({
	path: z.string().min(1),
	updatedAt: z.string().optional(),
});

export const desktopStateSnapshotSchema = z.object({
	settings: z.array(userSettingDtoSchema),
	explorerLastPath: desktopStateExplorerLastPathSchema.nullable(),
});

export type DesktopStateSnapshot = z.infer<typeof desktopStateSnapshotSchema>;

const PATH = '/api/desktop-state';

export async function load(): Promise<DesktopStateSnapshot> {
	const { data } = await apiClient.get<unknown>(PATH);
	return desktopStateSnapshotSchema.parse(data);
}

export async function save(snapshot: DesktopStateSnapshot): Promise<DesktopStateSnapshot> {
	const { data } = await apiClient.put<unknown>(PATH, snapshot);
	return desktopStateSnapshotSchema.parse(data);
}

export const desktopStateApi = {
	load,
	save,
} as const;
