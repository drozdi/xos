import type { DeviceDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceForm(
	data: DeviceDetail,
): Partial<Record<keyof DeviceDetail & string, string>> {
	const errors: Partial<Record<keyof DeviceDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}
	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
