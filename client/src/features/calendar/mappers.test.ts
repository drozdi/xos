import { describe, expect, it } from 'vitest';

import { mapOwnEvent, mapSchooltaskEvent, mapTodoDue } from './mappers';

describe('calendar mappers', () => {
	it('maps own event', () => {
		const vm = mapOwnEvent({
			id: 1,
			calendar_id: 2,
			title: 'Meeting',
			description: null,
			start_at: '2026-07-27T10:00:00',
			end_at: '2026-07-27T11:00:00',
			all_day: false,
			color: '#1975d2',
		});
		expect(vm.uid).toBe('own-1');
		expect(vm.source).toBe('own');
		expect(vm.editable).toBe(true);
	});

	it('maps todo due: midnight all-day, otherwise timed with duration', () => {
		const midnight = mapTodoDue({
			id: 5,
			list_id: 1,
			list_title: 'A',
			list_color: '#fff59d',
			text: 'Buy milk',
			done: false,
			due_at: '2026-07-27T00:00:00',
		});
		expect(midnight?.uid).toBe('todo-5');
		expect(midnight?.allDay).toBe(true);
		expect(midnight?.start).toBe('2026-07-27 00:00:00');
		expect(midnight?.editable).toBe(false);

		const timed = mapTodoDue({
			id: 6,
			list_id: 1,
			list_title: 'A',
			list_color: '#fff59d',
			text: 'Call',
			done: false,
			due_at: '2026-07-27 18:30:00',
		});
		expect(timed?.allDay).toBe(false);
		expect(timed?.start).toBe('2026-07-27 18:30:00');
		expect(timed?.end).toBe('2026-07-27 19:00:00');
	});

	it('maps schooltask lesson', () => {
		const vm = mapSchooltaskEvent({
			id: 9,
			name: 'Math',
			start: '2026-07-27 09:00:00',
			end: '2026-07-27 09:45:00',
			color: 'green',
		} as never);
		expect(vm.uid).toBe('st-9');
		expect(vm.source).toBe('schooltask');
		expect(vm.color).toBe('green');
	});
});
