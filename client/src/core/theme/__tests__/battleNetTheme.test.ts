import { describe, expect, it } from 'vitest';

import { BATTLE_NET, createBattleNetTheme } from '@/core/theme/battleNetTheme';

describe('battleNetTheme', () => {
	it('uses Battle.net Shop dark palette', () => {
		expect(BATTLE_NET.bg).toBe('#15171e');
		expect(BATTLE_NET.accent).toBe('#148eff');
	});

	it('sets blue primary to Battle.net accent', () => {
		const theme = createBattleNetTheme();
		expect(theme.colors?.blue?.[6]).toBe('#148eff');
	});
});
