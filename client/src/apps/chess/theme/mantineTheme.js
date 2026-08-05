import { createTheme } from '@mantine/core';

import { createBattleNetTheme } from '@/core/theme/battleNetTheme';

export const mantineTheme = createTheme(createBattleNetTheme(), {
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
});

export const colorSchemeManagerKey = 'chess-color-scheme';
