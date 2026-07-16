import type { GroupDetail } from '@/core/api/endpoints/mainApi';

export function validateGroupForm(data: GroupDetail): Partial<Record<keyof GroupDetail & string, string>> {
	const errors: Partial<Record<keyof GroupDetail & string, string>> = {};

	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.ou_id) {
		errors.ou_id = 'Обязательное поле';
	}

	return errors;
}
