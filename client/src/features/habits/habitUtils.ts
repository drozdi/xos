export const HABIT_TITLE_PREFIX = 'Habit: ';
export const HABITS_STREAK_CODE = 'habits.streaks';

export function isHabitListTitle(title: string): boolean {
	return title.trim().toLowerCase().startsWith(HABIT_TITLE_PREFIX.toLowerCase());
}

export function habitDisplayName(title: string): string {
	const trimmed = title.trim();
	if (isHabitListTitle(trimmed)) {
		return trimmed.slice(HABIT_TITLE_PREFIX.length).trim() || trimmed;
	}
	return trimmed;
}

export function toHabitListTitle(name: string): string {
	const clean = name.trim();
	if (isHabitListTitle(clean)) {
		return clean;
	}
	return `${HABIT_TITLE_PREFIX}${clean || 'Новая привычка'}`;
}

/** Local YYYY-MM-DD */
export function formatDayKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function startOfWeekMonday(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	return d;
}

export function weekDayKeys(anchor: Date = new Date()): string[] {
	const start = startOfWeekMonday(anchor);
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return formatDayKey(d);
	});
}

export type HabitStreaks = Record<string, { count: number; lastDate: string | null }>;

export function computeStreak(doneDates: string[], todayKey: string): number {
	const set = new Set(doneDates);
	let cursor = todayKey;
	if (!set.has(cursor)) {
		const yesterday = new Date(`${todayKey}T12:00:00`);
		yesterday.setDate(yesterday.getDate() - 1);
		cursor = formatDayKey(yesterday);
		if (!set.has(cursor)) {
			return 0;
		}
	}
	let count = 0;
	while (set.has(cursor)) {
		count += 1;
		const prev = new Date(`${cursor}T12:00:00`);
		prev.setDate(prev.getDate() - 1);
		cursor = formatDayKey(prev);
	}
	return count;
}
