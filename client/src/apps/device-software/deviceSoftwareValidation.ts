import type { SoftwareDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceSoftwareForm(
	data: SoftwareDetail,
): Partial<Record<keyof SoftwareDetail & string, string>> {
	const errors: Partial<Record<keyof SoftwareDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}

	return errors;
}
