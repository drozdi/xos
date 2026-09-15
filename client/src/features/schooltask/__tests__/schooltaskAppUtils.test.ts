import { describe, expect, it } from 'vitest';

import { extractSubjectUserIds } from '@/features/schooltask/schooltaskAppUtils';

describe('extractSubjectUserIds', () => {
	it('maps user_id values', () => {
		expect(extractSubjectUserIds([{ user_id: 1 }, { user_id: 7 }])).toEqual([1, 7]);
	});

	it('filters non-positive ids', () => {
		expect(extractSubjectUserIds([{ user_id: 0 }, { user_id: -3 }, { user_id: 4 }])).toEqual([4]);
	});

	it('returns empty array for undefined', () => {
		expect(extractSubjectUserIds(undefined)).toEqual([]);
	});

	it('returns empty array for empty list', () => {
		expect(extractSubjectUserIds([])).toEqual([]);
	});
});
