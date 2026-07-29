import type { UserDetail } from '@/core/api/endpoints/mainApi';

export function validateUserForm(data: UserDetail): Partial<Record<keyof UserDetail & string, string>> {
	const errors: Partial<Record<keyof UserDetail & string, string>> = {};

	if (!data.login?.trim()) {
		errors.login = 'Обязательное поле';
	}
	if (!data.alias?.trim()) {
		errors.alias = 'Обязательное поле';
	}

	const password = typeof data.password === 'string' ? data.password : '';
	const confirm =
		typeof data.confirm_password === 'string' ? data.confirm_password : '';

	if (password || confirm) {
		if (!password) {
			errors.password = 'Укажите пароль';
		} else if (password.length < 6) {
			errors.password = 'Пароль должен быть не короче 6 символов';
		} else if (password !== confirm) {
			errors.password = 'Пароли не совпадают';
		}
	}

	return errors;
}
