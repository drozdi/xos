import type { SoftwareTypeDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceSoftwareTypeForm(
	data: SoftwareTypeDetail,
): Partial<Record<keyof SoftwareTypeDetail & string, string>> {
	const errors: Partial<Record<keyof SoftwareTypeDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
