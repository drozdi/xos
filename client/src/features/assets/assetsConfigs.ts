import type { ListRequest, PaginatedResponse } from '@/types/api.types';

import {
	assetsContractApi,
	assetsFleetApi,
	assetsPartyApi,
	assetsRoomApi,
	assetsSoftwareApi,
	assetsWarehouseApi,
	type Contract,
	type FleetVehicle,
	type Party,
	type Room,
	type SoftPackage,
	type WarehouseItem,
} from '@/core/api/endpoints/assetsApi';
import { queryKeys } from '@/core/api/queryKeys';

import {
	contractAccess,
	fleetAccess,
	partyAccess,
	roomAccess,
	softwareAccess,
	warehouseAccess,
} from './assetsAccess';

export type AssetsFieldType = 'text' | 'number' | 'textarea' | 'select-remote';

export type AssetsField = {
	type: AssetsFieldType;
	key: string;
	label: string;
	required?: boolean;
	remote?: 'party';
};

export type AssetsListColumn = {
	field: string;
	header: string;
	width?: number;
};

export type AssetsCatalogConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
	listAppId: string;
	detailAppId: string;
	listTitle: string;
	detailTitle: string;
	entityLabel: string;
	createLabel: string;
	storageKey: string;
	listColumns: AssetsListColumn[];
	fields: AssetsField[];
	initialData: T;
	access: {
		canRead: () => boolean;
		canCreate: () => boolean;
		canUpdate: () => boolean;
		canDelete: () => boolean;
		useCanRead: () => boolean;
		useCanCreate: () => boolean;
		useCanUpdate: () => boolean;
		useCanDelete: () => boolean;
	};
	api: {
		list: (request: ListRequest) => Promise<PaginatedResponse<T>>;
		get: (id: number) => Promise<T>;
		create: (body: Partial<T>) => Promise<number>;
		update: (id: number, body: Partial<T>) => Promise<number>;
		remove: (id: number) => Promise<void>;
	};
	listQueryKey: (filters: ListRequest) => readonly unknown[];
	detailQueryKey: readonly unknown[];
};

export const warehouseCatalogConfig: AssetsCatalogConfig<WarehouseItem> = {
	listAppId: 'assets-warehouse',
	detailAppId: 'assets-warehouse-item',
	listTitle: 'Склад',
	detailTitle: 'Позиция склада',
	entityLabel: 'Позиция',
	createLabel: 'Новая позиция',
	storageKey: 'assets-warehouse',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'sku', header: 'SKU', width: 120 },
		{ field: 'qty', header: 'Кол-во', width: 90 },
		{ field: 'unit', header: 'Ед.', width: 70 },
		{ field: 'location', header: 'Место', width: 140 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'sku', label: 'SKU' },
		{ type: 'number', key: 'qty', label: 'Количество' },
		{ type: 'text', key: 'unit', label: 'Единица' },
		{ type: 'text', key: 'location', label: 'Место хранения' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		sku: null,
		qty: '0',
		unit: null,
		location: null,
		notes: null,
		sort: 100,
	},
	access: warehouseAccess,
	api: assetsWarehouseApi,
	listQueryKey: queryKeys.assets.warehouse,
	detailQueryKey: ['assets', 'warehouse'],
};

export const fleetCatalogConfig: AssetsCatalogConfig<FleetVehicle> = {
	listAppId: 'assets-fleet',
	detailAppId: 'assets-fleet-vehicle',
	listTitle: 'Автопарк',
	detailTitle: 'Транспорт',
	entityLabel: 'Транспорт',
	createLabel: 'Новый транспорт',
	storageKey: 'assets-fleet',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'plate', header: 'Госномер', width: 110 },
		{ field: 'brand', header: 'Марка', width: 120 },
		{ field: 'model', header: 'Модель', width: 120 },
		{ field: 'year', header: 'Год', width: 70 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'plate', label: 'Госномер' },
		{ type: 'text', key: 'vin', label: 'VIN' },
		{ type: 'text', key: 'brand', label: 'Марка' },
		{ type: 'text', key: 'model', label: 'Модель' },
		{ type: 'number', key: 'year', label: 'Год' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		plate: null,
		vin: null,
		brand: null,
		model: null,
		year: null,
		notes: null,
		sort: 100,
	},
	access: fleetAccess,
	api: assetsFleetApi,
	listQueryKey: queryKeys.assets.fleet,
	detailQueryKey: ['assets', 'fleet'],
};

export const partiesCatalogConfig: AssetsCatalogConfig<Party> = {
	listAppId: 'assets-parties',
	detailAppId: 'assets-party',
	listTitle: 'Контрагенты',
	detailTitle: 'Контрагент',
	entityLabel: 'Контрагент',
	createLabel: 'Новый контрагент',
	storageKey: 'assets-parties',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'inn', header: 'ИНН', width: 120 },
		{ field: 'phone', header: 'Телефон', width: 130 },
		{ field: 'email', header: 'Email', width: 180 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'inn', label: 'ИНН' },
		{ type: 'text', key: 'phone', label: 'Телефон' },
		{ type: 'text', key: 'email', label: 'Email' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		inn: null,
		phone: null,
		email: null,
		notes: null,
		sort: 100,
	},
	access: partyAccess,
	api: assetsPartyApi,
	listQueryKey: queryKeys.assets.parties,
	detailQueryKey: ['assets', 'party'],
};

export const contractsCatalogConfig: AssetsCatalogConfig<Contract> = {
	listAppId: 'assets-contracts',
	detailAppId: 'assets-contract',
	listTitle: 'Договоры',
	detailTitle: 'Договор',
	entityLabel: 'Договор',
	createLabel: 'Новый договор',
	storageKey: 'assets-contracts',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'number', header: 'Номер', width: 110 },
		{ field: 'party', header: 'Контрагент', width: 180 },
		{ field: 'date_from', header: 'С', width: 110 },
		{ field: 'date_to', header: 'По', width: 110 },
		{ field: 'amount', header: 'Сумма', width: 100 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'number', label: 'Номер' },
		{ type: 'select-remote', key: 'party_id', label: 'Контрагент', remote: 'party' },
		{ type: 'text', key: 'date_from', label: 'Дата начала' },
		{ type: 'text', key: 'date_to', label: 'Дата окончания' },
		{ type: 'number', key: 'amount', label: 'Сумма' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		number: null,
		party_id: null,
		party: null,
		date_from: null,
		date_to: null,
		amount: null,
		notes: null,
		sort: 100,
	},
	access: contractAccess,
	api: assetsContractApi,
	listQueryKey: queryKeys.assets.contracts,
	detailQueryKey: ['assets', 'contract'],
};

export const roomsCatalogConfig: AssetsCatalogConfig<Room> = {
	listAppId: 'assets-rooms',
	detailAppId: 'assets-room',
	listTitle: 'Помещения',
	detailTitle: 'Помещение',
	entityLabel: 'Помещение',
	createLabel: 'Новое помещение',
	storageKey: 'assets-rooms',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'building', header: 'Здание', width: 160 },
		{ field: 'floor', header: 'Этаж', width: 80 },
		{ field: 'area', header: 'Площадь', width: 90 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'building', label: 'Здание' },
		{ type: 'text', key: 'floor', label: 'Этаж' },
		{ type: 'number', key: 'area', label: 'Площадь' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		building: null,
		floor: null,
		area: null,
		notes: null,
		sort: 100,
	},
	access: roomAccess,
	api: assetsRoomApi,
	listQueryKey: queryKeys.assets.rooms,
	detailQueryKey: ['assets', 'room'],
};

export const softwareCatalogConfig: AssetsCatalogConfig<SoftPackage> = {
	listAppId: 'assets-software',
	detailAppId: 'assets-software-item',
	listTitle: 'ПО',
	detailTitle: 'Программный пакет',
	entityLabel: 'ПО',
	createLabel: 'Новый пакет',
	storageKey: 'assets-software',
	listColumns: [
		{ field: 'name', header: 'Название' },
		{ field: 'vendor', header: 'Вендор', width: 140 },
		{ field: 'version', header: 'Версия', width: 100 },
		{ field: 'license_type', header: 'Лицензия', width: 120 },
		{ field: 'seats', header: 'Мест', width: 70 },
		{ field: 'sort', header: 'Сорт.', width: 70 },
	],
	fields: [
		{ type: 'text', key: 'name', label: 'Название', required: true },
		{ type: 'text', key: 'vendor', label: 'Вендор' },
		{ type: 'text', key: 'version', label: 'Версия' },
		{ type: 'text', key: 'license_type', label: 'Тип лицензии' },
		{ type: 'number', key: 'seats', label: 'Мест' },
		{ type: 'number', key: 'sort', label: 'Сортировка' },
		{ type: 'textarea', key: 'notes', label: 'Заметки' },
	],
	initialData: {
		id: 0,
		name: '',
		vendor: null,
		version: null,
		license_type: null,
		seats: null,
		notes: null,
		sort: 100,
	},
	access: softwareAccess,
	api: assetsSoftwareApi,
	listQueryKey: queryKeys.assets.software,
	detailQueryKey: ['assets', 'software'],
};
