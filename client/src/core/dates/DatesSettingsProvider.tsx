import {
	createContext,
	useContext,
	useMemo,
	type ReactNode,
} from 'react';

import { useSetState } from '@/core/settings/hooks';

import {
	DATE_LOCALE_SETTING_KEY,
	DATE_TIME_FORMAT_SETTING_KEY,
	DEFAULT_DATE_LOCALE,
	DEFAULT_DATE_TIME_FORMAT,
	type DateLocaleOption,
	type DateTimeFormatOption,
} from './types';

interface DatesSettingsContextValue {
	locale: DateLocaleOption;
	timeFormat: DateTimeFormatOption;
	setLocale: (value: DateLocaleOption) => void;
	setTimeFormat: (value: DateTimeFormatOption) => void;
	isLoading: boolean;
}

const DatesSettingsContext = createContext<DatesSettingsContextValue | null>(null);

export function DatesSettingsProvider({ children }: { children: ReactNode }) {
	const [locale, setLocale, localeLoading] = useSetState<DateLocaleOption>(
		'USER',
		DATE_LOCALE_SETTING_KEY,
		DEFAULT_DATE_LOCALE,
	);
	const [timeFormat, setTimeFormat, formatLoading] = useSetState<DateTimeFormatOption>(
		'USER',
		DATE_TIME_FORMAT_SETTING_KEY,
		DEFAULT_DATE_TIME_FORMAT,
	);

	const isLoading = localeLoading || formatLoading;

	const contextValue = useMemo(
		() => ({
			locale,
			timeFormat,
			setLocale,
			setTimeFormat,
			isLoading,
		}),
		[isLoading, locale, setLocale, setTimeFormat, timeFormat],
	);

	return (
		<DatesSettingsContext.Provider value={contextValue}>{children}</DatesSettingsContext.Provider>
	);
}

export function useDateSettings(): DatesSettingsContextValue {
	const context = useContext(DatesSettingsContext);
	if (!context) {
		throw new Error('useDateSettings must be used within DatesSettingsProvider');
	}
	return context;
}
