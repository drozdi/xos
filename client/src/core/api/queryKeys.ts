import type { ListRequest, SettingCategory } from '@/types/api.types';

export const queryKeys = {
	auth: {
		user: ['auth', 'user'] as const,
		check: ['auth', 'check'] as const,
	},
	account: {
		detail: ['account', 'detail'] as const,
		map: ['account', 'map'] as const,
		accesses: ['account', 'accesses'] as const,
		roles: ['account', 'roles'] as const,
		options: ['account', 'options'] as const,
	},
	settings: {
		all: (category?: SettingCategory) => ['settings', category ?? 'all'] as const,
		one: (category: SettingCategory, key: string) => ['settings', category, key] as const,
	},
	main: {
		users: (filters: ListRequest) => ['main', 'users', filters] as const,
		user: (id: number) => ['main', 'user', id] as const,
		groups: (filters: ListRequest) => ['main', 'groups', filters] as const,
	},
	device: {
		list: (filters: ListRequest) => ['device', 'list', filters] as const,
		detail: (id: number) => ['device', 'detail', id] as const,
	},
} as const;
