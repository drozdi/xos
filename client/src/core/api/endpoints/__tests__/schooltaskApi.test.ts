import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();

vi.mock('@/core/api/client', () => ({
	apiClient: {
		post: (...args: unknown[]) => post(...args),
		get: vi.fn(),
	},
}));

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';

describe('schooltaskCalendarApi FormData uploads', () => {
	beforeEach(() => {
		post.mockReset();
	});

	it('teacherSave posts FormData without forcing Content-Type', async () => {
		post.mockResolvedValue({ data: null });

		await schooltaskCalendarApi.teacherSave(
			{ id: 1, title: 'Lesson', files: [10, 11] },
			[new File(['a'], 'a.txt', { type: 'text/plain' })],
		);

		expect(post).toHaveBeenCalledTimes(1);
		const [url, body, config] = post.mock.calls[0]!;
		expect(url).toBe('/api/schooltask/calendar/teacher/events/save');
		expect(body).toBeInstanceOf(FormData);
		expect(config).toBeUndefined();
		expect((body as FormData).get('event[title]')).toBe('Lesson');
		expect((body as FormData).getAll('event[files][]')).toEqual(['10', '11']);
		expect((body as FormData).getAll('files[]')).toHaveLength(1);
	});

	it('teacherFilesUpload posts FormData without forcing Content-Type', async () => {
		post.mockResolvedValue({ data: [] });

		await schooltaskCalendarApi.teacherFilesUpload([
			new File(['b'], 'b.txt', { type: 'text/plain' }),
		]);

		expect(post).toHaveBeenCalledTimes(1);
		const [url, body, config] = post.mock.calls[0]!;
		expect(url).toBe('/api/schooltask/calendar/teacher/files/upload');
		expect(body).toBeInstanceOf(FormData);
		expect(config).toBeUndefined();
	});
});
