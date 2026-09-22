import type { IblockSectionDetail } from '@/core/api/endpoints/iblockApi';

export function validateIblockSectionForm(
	data: IblockSectionDetail,
): Partial<Record<keyof IblockSectionDetail & string, string>> {
	const errors: Partial<Record<keyof IblockSectionDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (data.block_id == null || data.block_id <= 0) {
		errors.block_id = 'Обязательное поле';
	}

	return errors;
}
