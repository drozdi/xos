import type { LicenseKeyDetail } from '@/core/api/endpoints/deviceApi';

export function validateDeviceLicenseKeyForm(
	data: LicenseKeyDetail,
): Partial<Record<keyof LicenseKeyDetail & string, string>> {
	return {};
}
