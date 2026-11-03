import { describe, expect, it } from 'vitest';

import { memberInitials, memberLabel, userRefLabel } from '@/features/board/cardMemberLabels';

describe('cardMemberLabels', () => {
	it('prefers alias then email then id', () => {
		expect(
			memberLabel({ user_id: 1, alias: ' Ada ', email: 'a@x.com', role: 'editor' }),
		).toBe('Ada');
		expect(
			memberLabel({ user_id: 2, alias: null, email: ' b@x.com ', role: 'observer' }),
		).toBe('b@x.com');
		expect(
			memberLabel({ user_id: 3, alias: null, email: null, role: 'admin' }),
		).toBe('User #3');
	});

	it('formats user refs and initials', () => {
		expect(userRefLabel({ id: 9, alias: null, email: null })).toBe('User #9');
		expect(userRefLabel({})).toBe('User');
		expect(
			memberInitials({ user_id: 1, alias: 'Ada Lovelace', email: null, role: 'editor' }),
		).toBe('AL');
		expect(
			memberInitials({ user_id: 1, alias: 'Bob', email: null, role: 'editor' }),
		).toBe('BO');
	});
});
