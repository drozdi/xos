import type { UserDetail } from '@/core/api/endpoints/mainApi';

export function validateUserForm(data: UserDetail): Partial<Record<keyof UserDetail & string, string>> {
	const errors: Partial<Record<keyof UserDetail & string, string>> = {};

	if (!data.login?.trim()) {
		errors.login = 'Обязательное поле';
	}
	if (!data.alias?.trim()) {
		errors.alias = 'Обязательное поле';
	}

	return errors;
}
