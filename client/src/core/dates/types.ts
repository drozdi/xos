export const DATE_LOCALE_SETTING_KEY = 'date.locale';
export const DATE_TIME_FORMAT_SETTING_KEY = 'date.timeFormat';

export const DEFAULT_DATE_LOCALE = 'ru';
export const DEFAULT_DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm';

export const DATE_LOCALE_OPTIONS = [
	{ value: 'ru', label: 'Русский' },
	{ value: 'en', label: 'English' },
] as const;

export type DateLocaleOption = (typeof DATE_LOCALE_OPTIONS)[number]['value'];

export const DATE_TIME_FORMAT_OPTIONS = [
	{ value: 'DD.MM.YYYY HH:mm', label: '31.12.2026 23:59' },
	{ value: 'DD/MM/YYYY HH:mm', label: '31/12/2026 23:59' },
	{ value: 'YYYY-MM-DD HH:mm', label: '2026-12-31 23:59' },
	{ value: 'DD.MM.YYYY', label: '31.12.2026 (без времени)' },
] as const;

export type DateTimeFormatOption = (typeof DATE_TIME_FORMAT_OPTIONS)[number]['value'];
