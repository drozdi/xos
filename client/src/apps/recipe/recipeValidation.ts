import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';

export function validateRecipeForm(
	data: IblockElementDetail,
): Partial<Record<keyof IblockElementDetail & string, string>> {
	const errors: Partial<Record<keyof IblockElementDetail & string, string>> = {};
	if (!data.name?.trim()) {
		errors.name = 'Укажите название';
	}
	if (!data.block_id) {
		errors.block_id = 'Инфоблок не загружен';
	}
	return errors;
}
