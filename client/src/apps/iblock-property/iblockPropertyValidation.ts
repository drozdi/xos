import type { IblockPropertyDetail } from '@/core/api/endpoints/iblockApi';

const ALLOWED_FIELD_TYPES = new Set(['S', 'N', 'F', 'L', 'E', 'G', 'P']);

export function validateIblockPropertyForm(
	data: IblockPropertyDetail,
): Partial<Record<keyof IblockPropertyDetail & string, string>> {
	const errors: Partial<Record<keyof IblockPropertyDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (data.block_id == null || data.block_id <= 0) {
		errors.block_id = 'Обязательное поле';
	}

	const fieldType = (data.field_type ?? '').toUpperCase();
	if (!ALLOWED_FIELD_TYPES.has(fieldType)) {
		errors.field_type = 'Допустимые типы: S, N, F, L, E, G, P';
	}

	if (fieldType === 'E' || fieldType === 'G') {
		if (data.link_iblock_id == null || data.link_iblock_id <= 0) {
			errors.link_iblock_id = 'Обязательное поле';
		}
	}

	return errors;
}
