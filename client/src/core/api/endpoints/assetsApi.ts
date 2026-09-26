import { z } from 'zod';

import {
	createEntity,
	getDetail,
	postList,
	removeEntity,
	updateEntity,
} from '@/core/api/crudHelpers';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

const BASE = '/api/assets';

const nullableString = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((v) => (v == null ? null : String(v)));

const nullableNumber = z
	.union([z.number(), z.string(), z.null(), z.undefined()])
	.transform((v) => {
		if (v == null || v === '') return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	});

const nullableDecimal = z
	.union([z.string(), z.number(), z.null(), z.undefined()])
	.transform((v) => {
		if (v == null || v === '') return null;
		return String(v);
	});

export const warehouseItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	sku: nullableString.optional(),
	qty: z
		.union([z.string(), z.number(), z.null(), z.undefined()])
		.transform((v) => (v == null || v === '' ? '0' : String(v))),
	unit: nullableString.optional(),
	location: nullableString.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type WarehouseItem = z.infer<typeof warehouseItemSchema>;

export const fleetVehicleSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	plate: nullableString.optional(),
	vin: nullableString.optional(),
	brand: nullableString.optional(),
	model: nullableString.optional(),
	year: nullableNumber.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type FleetVehicle = z.infer<typeof fleetVehicleSchema>;

export const partySchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	inn: nullableString.optional(),
	phone: nullableString.optional(),
	email: nullableString.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type Party = z.infer<typeof partySchema>;

export const contractSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	number: nullableString.optional(),
	party_id: nullableNumber.optional(),
	party: nullableString.optional(),
	date_from: nullableString.optional(),
	date_to: nullableString.optional(),
	amount: nullableDecimal.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type Contract = z.infer<typeof contractSchema>;

export const roomSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	building: nullableString.optional(),
	floor: nullableString.optional(),
	area: nullableDecimal.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type Room = z.infer<typeof roomSchema>;

export const softPackageSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	vendor: nullableString.optional(),
	version: nullableString.optional(),
	license_type: nullableString.optional(),
	seats: nullableNumber.optional(),
	notes: nullableString.optional(),
	sort: z.number().nullable().optional().transform((v) => v ?? 100),
});

export type SoftPackage = z.infer<typeof softPackageSchema>;

function createCrudApi<T extends { id: number }>(
	basePath: string,
	schema: z.ZodType<T>,
) {
	return {
		list: (request: ListRequest): Promise<PaginatedResponse<T>> =>
			postList(`${basePath}/list`, request, z.array(schema)),
		get: (id: number) => getDetail(`${basePath}/${id}`, schema),
		create: (body: Partial<T>) => createEntity(`${basePath}/`, body),
		update: (id: number, body: Partial<T>) => updateEntity(basePath, id, body),
		remove: (id: number) => removeEntity(basePath, id),
	};
}

export const assetsWarehouseApi = createCrudApi(`${BASE}/warehouse`, warehouseItemSchema);
export const assetsFleetApi = createCrudApi(`${BASE}/fleet`, fleetVehicleSchema);
export const assetsPartyApi = createCrudApi(`${BASE}/parties`, partySchema);
export const assetsContractApi = createCrudApi(`${BASE}/contracts`, contractSchema);
export const assetsRoomApi = createCrudApi(`${BASE}/rooms`, roomSchema);
export const assetsSoftwareApi = createCrudApi(`${BASE}/software`, softPackageSchema);
