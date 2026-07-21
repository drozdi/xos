export const LICENSE_TYPES = ['RTL', 'OEM', 'VLS', 'FREE'] as const;

export const LICENSE_KEY_TYPES = ['VLK', 'KMS', 'MAK'] as const;

export const LICENSE_SOFTWARE_COUNT_MIN = -1;
export const LICENSE_SOFTWARE_COUNT_MAX = 9999;

export type LicenseType = (typeof LICENSE_TYPES)[number];
export type LicenseKeyType = (typeof LICENSE_KEY_TYPES)[number];
