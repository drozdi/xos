import { beforeEach, describe, expect, it } from 'vitest';

import {
	checkHasScope,
	getCanScope,
	getLevelScope,
	joinLevel,
	joinScopes,
	resetScopes,
	setLevelScopes,
	setMapScopes,
} from '@/core/auth/coreScopes';

describe('coreScopes', () => {
	beforeEach(() => {
		resetScopes();
	});

	it('resolves level scopes with bitwise OR along path', () => {
		setLevelScopes({
			app: 1,
			'app.users': 2,
		});

		expect(getLevelScope('app.users.read')).toBe(3);
	});

	it('joinLevel merges additional levels', () => {
		setLevelScopes({ app: 1 });
		joinLevel({ 'app.write': 4 });

		expect(getLevelScope('app.write')).toBe(5);
	});

	it('resolves can_ scopes from flattened app map', () => {
		setMapScopes({
			main: {
				users: {
					can_read: 1,
					can_write: 2,
				},
			},
		});

		expect(getCanScope('can_read.main')).toBe(1);
		expect(getCanScope('can_write.main')).toBe(2);
	});

	it('checkHasScope requires both level and can flags', () => {
		setLevelScopes({ read: 1, 'read.app': 1 });
		setMapScopes({
			app: {
				users: { can_read: 1 },
			},
		});

		expect(checkHasScope('can_read.app')).toBe(true);
		expect(checkHasScope('can_write.app')).toBe(false);
	});

	it('checkHasScope supports negation prefix', () => {
		setLevelScopes({ read: 0 });
		setMapScopes({ app: { can_read: 0 } });

		expect(checkHasScope('!can_read.app')).toBe(true);
	});

	it('resets scopes and cache on logout flow', () => {
		setLevelScopes({ app: 1 });
		setMapScopes({ app: { can_read: 1 } });
		resetScopes();

		expect(getLevelScope('app.read')).toBe(0);
		expect(getCanScope('can_read.app')).toBe(0);
	});

	it('joinScopes flattens nested can_ keys per app', () => {
		joinScopes('settings', {
			profile: {
				can_edit: 1,
				nested: { can_view: 2 },
			},
		});

		expect(getCanScope('can_edit.settings')).toBe(1);
		expect(getCanScope('can_view.settings')).toBe(2);
	});
});
