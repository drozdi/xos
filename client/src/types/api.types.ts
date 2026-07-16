/** Shared API response types — Stage 4 */

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	refresh_token: string;
	user?: UserSummary;
}

export interface RefreshResponse {
	token: string;
	refresh_token: string;
}

export interface UserSummary {
	id: number;
	email: string | null;
	login?: string | null;
	alias?: string | null;
	roles: string[];
	scopes?: Record<string, number>;
}

export interface LoginCheckResponse {
	status: string;
}

export interface LogoutResponse {
	status: string;
}

export interface AccountDetail {
	id: number;
	email: string | null;
	alias: string | null;
	second_name: string | null;
	first_name: string | null;
	patronymic: string | null;
	description: string | null;
	date_register: string | null;
	tutor: string;
	last_login: string | null;
	x_timestamp: string | null;
}

export type SettingCategory = 'USER' | 'APP' | 'WIN' | 'HKEY_CONFIG';

export interface UserSettingDto {
	category: SettingCategory;
	key: string;
	value: unknown;
	updatedAt?: string;
}

export interface SettingsBatchRequest {
	items: Array<{ category: SettingCategory; key: string; value: unknown }>;
}

export interface ListRequest {
	t?: 'list' | 'select';
	limit?: number;
	offset?: number;
	sortBy?: Array<{ key: string; order: 'ASC' | 'DESC' }>;
	filters?: Record<string, unknown>;
}

export interface UserListItem {
	id: number;
	login: string;
	alias: string;
	ou: string;
	tutor: string;
}

export interface AccountUpdateRequest {
	email?: string | null;
	alias?: string;
	second_name?: string;
	first_name?: string;
	patronymic?: string;
	description?: string;
	password?: string;
	confirm_password?: string;
}

export interface ApiError {
	code?: number;
	message?: string;
	error?: string;
	[field: string]: unknown;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	perPage: number;
}
