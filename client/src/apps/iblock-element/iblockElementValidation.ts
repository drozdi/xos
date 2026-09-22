import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';

export function validateIblockElementForm(
	data: IblockElementDetail,
): Partial<Record<keyof IblockElementDetail & string, string>> {
	const errors: Partial<Record<keyof IblockElementDetail & string, string>> = {};

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
