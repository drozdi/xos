import type { IblockTypeDetail } from '@/core/api/endpoints/iblockApi';

export function validateIblockTypeForm(
	data: IblockTypeDetail,
): Partial<Record<keyof IblockTypeDetail & string, string>> {
	const errors: Partial<Record<keyof IblockTypeDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
