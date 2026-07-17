import type { PropertyDetail } from '@/core/api/endpoints/deviceApi';

export function validateDevicePropertyForm(
	data: PropertyDetail,
): Partial<Record<keyof PropertyDetail & string, string>> {
	const errors: Partial<Record<keyof PropertyDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
