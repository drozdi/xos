import { describe, expect, it } from 'vitest';

import { BATTLE_NET, createBattleNetTheme } from '@/core/theme/battleNetTheme';

describe('battleNetTheme', () => {
	it('uses Blizzard.com dark palette tokens', () => {
		expect(BATTLE_NET.bg).toBe('#151c28');
		expect(BATTLE_NET.surface).toBe('#151c28');
		expect(BATTLE_NET.accent).toBe('#0592ff');
	});

	it('sets blue primary to Blizzard accent', () => {
		const theme = createBattleNetTheme();
		expect(theme.colors?.blue?.[6]).toBe('#0592ff');
	});
});
