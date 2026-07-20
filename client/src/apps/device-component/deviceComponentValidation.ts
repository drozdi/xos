import type { ComponentDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceComponentForm(
	data: ComponentDetail,
): Partial<Record<keyof ComponentDetail & string, string>> {
	const errors: Partial<Record<keyof ComponentDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (!data.property_id) {
		errors.property_id = 'Обязательное поле';
	}

	return errors;
}
