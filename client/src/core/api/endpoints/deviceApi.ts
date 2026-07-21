import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import {
	createEntity,
	getDetail,
	postList,
	removeEntity,
	updateEntity,
} from '@/core/api/crudHelpers';
import { normalizeIdRecord } from '@/features/device/deviceAppUtils';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

const idRecordSchema = z.preprocess(
	(value) => normalizeIdRecord<Record<string, unknown>>(value),
	z.record(z.string(), z.record(z.string(), z.unknown())),
);

type FilterOption = {
	label?: string;
	sublabel?: string;
	value?: number | string;
	type?: string;
	title?: string;
	children?: FilterOption[];
};

const filterOptionSchema: z.ZodType<FilterOption> = z.lazy(() =>
	z.object({
		label: z.string().optional(),
		sublabel: z.string().optional(),
		value: z.union([z.number(), z.string()]).optional(),
		type: z.string().optional(),
		title: z.string().optional(),
		children: z.array(filterOptionSchema).optional(),
	}),
);

export const deviceListItemSchema = z.object({
	id: z.number(),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	location: z.string().nullable().optional().transform((v) => v ?? ''),
	inNo: z.string().nullable().optional().transform((v) => v ?? ''),
	dateCreated: z.string().nullable().optional().transform((v) => v ?? ''),
	xTimestamp: z.string().nullable().optional().transform((v) => v ?? ''),
});

export const deviceDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		title: z.string().nullable().optional(),
		typeId: z.number().nullable().optional(),
		sort: z.number().nullable().optional(),
		description: z.string().nullable().optional(),
		log: z.string().nullable().optional(),
		dateCreated: z.string().nullable().optional(),
		createdBy: z.string().nullable().optional(),
		xTimestamp: z.string().nullable().optional(),
		modifiedBy: z.string().nullable().optional(),
		accounting: z.record(z.string(), z.unknown()).optional(),
		locations: idRecordSchema.optional(),
		repairs: idRecordSchema.optional(),
		properties: idRecordSchema.optional(),
		licenses: idRecordSchema.optional(),
		images: idRecordSchema.optional(),
	})
	.passthrough();

export const subDeviceListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	type: z.string().nullable().optional().transform((v) => v ?? ''),
	inNo: z.string().nullable().optional().transform((v) => v ?? ''),
});

export const subDeviceDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		title: z.string().nullable().optional(),
		type_id: z.number().nullable().optional(),
		sort: z.number().nullable().optional(),
		description: z.string().nullable().optional(),
		log: z.string().nullable().optional(),
		dateCreated: z.string().nullable().optional(),
		createdBy: z.string().nullable().optional(),
		xTimestamp: z.string().nullable().optional(),
		modifiedBy: z.string().nullable().optional(),
		accounting: z.record(z.string(), z.unknown()).optional(),
		histories: idRecordSchema.optional(),
		properties: idRecordSchema.optional(),
	})
	.passthrough();

export const typeListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
	group_id: z.number().nullable().optional(),
	group_name: z.string().nullable().optional().transform((v) => v ?? ''),
	group_code: z.string().nullable().optional().transform((v) => v ?? ''),
	group_sort: z.number().nullable().optional(),
});

export const typeDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		components: z.array(z.number()).optional(),
		properties: idRecordSchema.optional(),
	})
	.passthrough();

export const propertyListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
	group_id: z.number().nullable().optional(),
	group_name: z.string().nullable().optional(),
	group_code: z.string().nullable().optional(),
	group_sort: z.number().nullable().optional(),
});

export const propertyCatalogOptionSchema = z.object({
	value: z.number(),
	label: z.string().optional(),
	sublabel: z.string().optional(),
	group: z.string().optional(),
});

export const propertyDetailSchema = z
	.object({
		id: z.number(),
		active: z.boolean().optional(),
		required: z.boolean().optional(),
		multiple: z.boolean().optional(),
		name: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		fieldType: z.string().nullable().optional(),
		listType: z.string().nullable().optional(),
		postfix: z.string().nullable().optional(),
		defaultValue: z.unknown().nullable().optional(),
		prototype_id: z.number().nullable().optional(),
		property_id: z.number().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		type_id: z.number().nullable().optional(),
		enums: idRecordSchema.optional(),
		links: idRecordSchema.optional(),
		varieties: z.unknown().optional(),
	})
	.passthrough();

export const componentListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
});

export const componentDetailSchema = z
	.object({
		id: z.number(),
		active: z.boolean().optional(),
		name: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		property_id: z.number().nullable().optional(),
		properties: idRecordSchema.optional(),
	})
	.passthrough();

export const softwareListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
	type_id: z.number().nullable().optional(),
	parent_id: z.number().nullable().optional(),
	group_id: z.number().nullable().optional(),
	group_name: z.string().nullable().optional().transform((v) => v ?? ''),
	group_type: z.string().nullable().optional().transform((v) => v ?? ''),
	group_sort: z.number().nullable().optional(),
});

export const softwareDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		type_id: z.number().nullable().optional(),
	})
	.passthrough();

export const softwareTypeListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
});

export const softwareTypeDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
	})
	.passthrough();

export const licenseListItemSchema = z.object({
	id: z.number(),
	license_id: z.number().nullable().optional(),
	code: z.string().nullable().optional().transform((v) => v ?? ''),
	type: z.string().nullable().optional().transform((v) => v ?? ''),
});

export const licenseDetailSchema = z
	.object({
		id: z.number(),
		code: z.string().nullable().optional(),
		type: z.string().nullable().optional(),
		no: z.string().nullable().optional(),
		autNo: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		dateReal: z.string().nullable().optional(),
		softwares: idRecordSchema.optional(),
	})
	.passthrough();

export const licenseKeyListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
});

export const licenseKeyDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		license_id: z.number().nullable().optional(),
		software_id: z.number().nullable().optional(),
		type_id: z.number().nullable().optional(),
		keys: idRecordSchema.optional(),
	})
	.passthrough();

export type DeviceDetail = z.infer<typeof deviceDetailSchema>;
export type SubDeviceDetail = z.infer<typeof subDeviceDetailSchema>;
export type TypeDetail = z.infer<typeof typeDetailSchema>;
export type PropertyDetail = z.infer<typeof propertyDetailSchema>;
export type ComponentDetail = z.infer<typeof componentDetailSchema>;
export type SoftwareDetail = z.infer<typeof softwareDetailSchema>;
export type SoftwareTypeDetail = z.infer<typeof softwareTypeDetailSchema>;
export type LicenseDetail = z.infer<typeof licenseDetailSchema>;
export type LicenseKeyDetail = z.infer<typeof licenseKeyDetailSchema>;

const BASE = '/api/device';

export const deviceApi = {
	filter: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/device/filter`);
		return z.array(filterOptionSchema).parse(data);
	},
	list: (request: ListRequest) =>
		postList(`${BASE}/device/list`, request, z.array(deviceListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/device/${id}`, deviceDetailSchema),
	create: (body: DeviceDetail) => createEntity(`${BASE}/device/`, body),
	update: (id: number, body: DeviceDetail) => updateEntity(`${BASE}/device`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/device`, id),
};

export const subDeviceApi = {
	filter: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/subDevices/filter`);
		return z.array(filterOptionSchema).parse(data);
	},
	list: (request: ListRequest) =>
		postList(`${BASE}/subDevices/list`, request, z.array(subDeviceListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/subDevices/${id}`, subDeviceDetailSchema),
	create: (body: SubDeviceDetail) => createEntity(`${BASE}/subDevices/`, body),
	update: (id: number, body: SubDeviceDetail) => updateEntity(`${BASE}/subDevices`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/subDevices`, id),
};

export const deviceTypeApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/types/list`, request, z.array(typeListItemSchema)),
	select: async (request: ListRequest = { limit: -1, offset: 1 }) => {
		const { data } = await apiClient.post<unknown>(`${BASE}/types/select`, request);
		return z.array(filterOptionSchema).parse(data);
	},
	components: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/types/components`);
		return z.array(filterOptionSchema).parse(data);
	},
	properties: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/types/properties`);
		return z.array(filterOptionSchema).parse(data);
	},
	propertyCatalog: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/types/property-catalog`);
		return z.array(propertyCatalogOptionSchema).parse(data);
	},
	propertyTemplate: (id: number) =>
		getDetail(`${BASE}/types/property-template/${id}`, propertyDetailSchema),
	get: (id: number) => getDetail(`${BASE}/types/${id}`, typeDetailSchema),
	create: (body: TypeDetail) => createEntity(`${BASE}/types/`, body),
	update: (id: number, body: TypeDetail) => updateEntity(`${BASE}/types`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/types`, id),
};

export const devicePropertyApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/properties/list`, request, z.array(propertyListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/properties/${id}`, propertyDetailSchema),
	create: (body: PropertyDetail) => createEntity(`${BASE}/properties/`, body),
	update: (id: number, body: PropertyDetail) => updateEntity(`${BASE}/properties`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/properties`, id),
};

export const deviceComponentApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/components/list`, request, z.array(componentListItemSchema)),
	propertyCatalog: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/components/property-catalog`);
		return z.array(propertyCatalogOptionSchema).parse(data);
	},
	propertyTemplate: (id: number) =>
		getDetail(`${BASE}/components/property-template/${id}`, propertyDetailSchema),
	get: (id: number) => getDetail(`${BASE}/components/${id}`, componentDetailSchema),
	create: (body: ComponentDetail) => createEntity(`${BASE}/components/`, body),
	update: (id: number, body: ComponentDetail) => updateEntity(`${BASE}/components`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/components`, id),
};

export const deviceSoftwareApi = {
	filter: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/software/filter`);
		return z.array(filterOptionSchema).parse(data);
	},
	list: (request: ListRequest) =>
		postList(`${BASE}/software/list`, request, z.array(softwareListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/software/${id}`, softwareDetailSchema),
	create: (body: SoftwareDetail) => createEntity(`${BASE}/software/`, body),
	update: (id: number, body: SoftwareDetail) => updateEntity(`${BASE}/software`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/software`, id),
};

export const deviceSoftwareTypeApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/software/type/list`, request, z.array(softwareTypeListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/software/type/${id}`, softwareTypeDetailSchema),
	create: (body: SoftwareTypeDetail) => createEntity(`${BASE}/software/type/`, body),
	update: (id: number, body: SoftwareTypeDetail) =>
		updateEntity(`${BASE}/software/type`, id, body),
	remove: (id: number) => removeEntity(`${BASE}/software/type`, id),
};

export const deviceLicenseApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/license/list`, request, z.array(licenseListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/license/${id}`, licenseDetailSchema),
	create: (body: LicenseDetail) => createEntity(`${BASE}/license/`, body),
	update: (id: number, body: LicenseDetail) => updateEntity(`${BASE}/license`, id, body),
	remove: async (id: number) => {
		await apiClient.delete(`${BASE}/license/remove/${id}`);
	},
};

export const deviceLicenseKeyApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/license/key/list`, request, z.array(licenseKeyListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/license/key/${id}`, licenseKeyDetailSchema),
	update: (id: number, body: LicenseKeyDetail) =>
		updateEntity(`${BASE}/license/key`, id, body),
};

export const deviceEndpoints = {
	base: BASE,
} as const;
