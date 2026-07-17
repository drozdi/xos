import type { LicenseKeyDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceLicenseKeyForm(
	data: LicenseKeyDetail,
): Partial<Record<keyof LicenseKeyDetail & string, string>> {
	const errors: Partial<Record<keyof LicenseKeyDetail & string, string>> = {};

	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}

	return errors;
}
