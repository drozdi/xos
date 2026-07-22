export interface LessonTemplate {
	lesson_number: number;
	start: string;
	end: string;
}

export const LESSON_TEMPLATES: LessonTemplate[] = [
	{ lesson_number: 1, start: '08:00:00', end: '08:40:00' },
	{ lesson_number: 2, start: '08:50:00', end: '09:30:00' },
	{ lesson_number: 3, start: '09:50:00', end: '10:30:00' },
	{ lesson_number: 4, start: '10:40:00', end: '11:20:00' },
	{ lesson_number: 5, start: '11:40:00', end: '12:20:00' },
	{ lesson_number: 6, start: '12:30:00', end: '13:10:00' },
	{ lesson_number: 7, start: '13:20:00', end: '14:00:00' },
	{ lesson_number: 8, start: '14:10:00', end: '14:50:00' },
];

export function applyLessonTemplate(
	date: string,
	lessonNumber: number,
): { start: string; end: string } | null {
	const template = LESSON_TEMPLATES.find((item) => item.lesson_number === lessonNumber);
	if (!template) {
		return null;
	}
	const day = date.slice(0, 10);

	return {
		start: `${day} ${template.start}`,
		end: `${day} ${template.end}`,
	};
}
