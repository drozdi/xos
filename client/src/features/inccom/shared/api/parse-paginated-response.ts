import type { PaginatedResponse } from '@inccom/shared/types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Безопасно разбирает page/size ответ API в единый формат. */
export function parsePaginatedResponse<T>(
	data: unknown,
	mapItem: (item: unknown) => T,
): PaginatedResponse<T> {
	if (!isRecord(data)) {
		return { items: [], total: 0, page: 1, size: 0, pages: 0 };
	}

	if (Array.isArray(data['items'])) {
		const items = data['items'];
		return {
			items: items.map(mapItem),
			total: Number(data['total'] ?? items.length),
			page: Number(data['page'] ?? 1),
			size: Number(data['size'] ?? items.length),
			pages: Number(data['pages'] ?? 1),
		};
	}

	return { items: [], total: 0, page: 1, size: 0, pages: 0 };
}
