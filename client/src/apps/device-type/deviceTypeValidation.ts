import type { TypeDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceTypeForm(
	data: TypeDetail,
): Partial<Record<keyof TypeDetail & string, string>> {
	const errors: Partial<Record<keyof TypeDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
