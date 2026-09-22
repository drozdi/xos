import type { IblockBlockDetail } from '@/core/api/endpoints/iblockApi';

export function validateIblockBlockForm(
	data: IblockBlockDetail,
): Partial<Record<keyof IblockBlockDetail & string, string>> {
	const errors: Partial<Record<keyof IblockBlockDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (data.type_id == null || data.type_id <= 0) {
		errors.type_id = 'Обязательное поле';
	}

	return errors;
}
