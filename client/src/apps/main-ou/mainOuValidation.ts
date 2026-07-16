import type { OuDetail } from '@/core/api/endpoints/mainApi';

export function validateOuForm(data: OuDetail): Partial<Record<keyof OuDetail & string, string>> {
	const errors: Partial<Record<keyof OuDetail & string, string>> = {};

	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.user_id) {
		errors.user_id = 'Обязательное поле';
	}

	return errors;
}
