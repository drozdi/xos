import { z } from 'zod';

import { userDataApi } from '@/core/api/endpoints/userData';

export const widgetClockPrefsSchema = z.object({
	hour12: z.boolean().default(false),
	showDate: z.boolean().default(true),
});

export type WidgetClockPrefs = z.infer<typeof widgetClockPrefsSchema>;

export const widgetWeatherPrefsSchema = z.object({
	city: z.string().default(''),
});

export type WidgetWeatherPrefs = z.infer<typeof widgetWeatherPrefsSchema>;

export const localReminderSchema = z.object({
	id: z.string(),
	at: z.string(),
	text: z.string(),
	firedAt: z.string().optional(),
});

export const widgetRemindersPrefsSchema = z.object({
	items: z.array(localReminderSchema).default([]),
});

export type LocalReminder = z.infer<typeof localReminderSchema>;
export type WidgetRemindersPrefs = z.infer<typeof widgetRemindersPrefsSchema>;

const CODES = {
	clock: 'widget.clock',
	weather: 'widget.weather',
	reminders: 'widget.reminders',
} as const;

async function loadPrefs<T>(code: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
	const dto = await userDataApi.getOptional(code);
	if (!dto) {
		return fallback;
	}
	const parsed = schema.safeParse(dto.value);
	return parsed.success ? parsed.data : fallback;
}

export async function loadClockPrefs(): Promise<WidgetClockPrefs> {
	return loadPrefs(CODES.clock, widgetClockPrefsSchema, { hour12: false, showDate: true });
}

export async function saveClockPrefs(prefs: WidgetClockPrefs): Promise<void> {
	await userDataApi.upsert({ code: CODES.clock, value: widgetClockPrefsSchema.parse(prefs) });
}

export async function loadWeatherPrefs(): Promise<WidgetWeatherPrefs> {
	const prefs = await loadPrefs(CODES.weather, widgetWeatherPrefsSchema, { city: '' });
	if (!prefs.city) {
		try {
			const legacy = localStorage.getItem('xos.widget-weather.city');
			if (legacy?.trim()) {
				const migrated = { city: legacy.trim() };
				await saveWeatherPrefs(migrated);
				localStorage.removeItem('xos.widget-weather.city');
				return migrated;
			}
		} catch {
			/* ignore */
		}
	}
	return prefs;
}

export async function saveWeatherPrefs(prefs: WidgetWeatherPrefs): Promise<void> {
	await userDataApi.upsert({ code: CODES.weather, value: widgetWeatherPrefsSchema.parse(prefs) });
}

export async function loadRemindersPrefs(): Promise<WidgetRemindersPrefs> {
	return loadPrefs(CODES.reminders, widgetRemindersPrefsSchema, { items: [] });
}

export async function saveRemindersPrefs(prefs: WidgetRemindersPrefs): Promise<void> {
	await userDataApi.upsert({
		code: CODES.reminders,
		value: widgetRemindersPrefsSchema.parse(prefs),
	});
}
