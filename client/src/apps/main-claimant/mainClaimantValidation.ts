import type { ClaimantDetail } from '@/core/api/endpoints/mainApi';

export function validateClaimantForm(
	data: ClaimantDetail,
): Partial<Record<keyof ClaimantDetail & string, string>> {
	const errors: Partial<Record<keyof ClaimantDetail & string, string>> = {};

	if (!data.code?.trim()) {
		errors.code = 'Обязательное поле';
	}
	if (!data.name?.trim()) {
		errors.name = 'Обязательное поле';
	}

	return errors;
}
