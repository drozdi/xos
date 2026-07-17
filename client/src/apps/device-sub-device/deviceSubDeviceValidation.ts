import type { SubDeviceDetail } from '@/core/api/endpoints/deviceApi';

export function validateSubDeviceForm(
	data: SubDeviceDetail,
): Partial<Record<keyof SubDeviceDetail & string, string>> {
	const errors: Partial<Record<keyof SubDeviceDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}

	return errors;
}
