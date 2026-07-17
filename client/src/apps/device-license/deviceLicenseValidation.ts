import type { LicenseDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceLicenseForm(
	data: LicenseDetail,
): Partial<Record<keyof LicenseDetail & string, string>> {
	const errors: Partial<Record<keyof LicenseDetail & string, string>> = {};

	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}

	return errors;
}
