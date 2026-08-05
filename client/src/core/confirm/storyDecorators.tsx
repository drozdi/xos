import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import type { Decorator } from '@storybook/react-vite';

import { battleNetCssVariablesResolver, createBattleNetTheme } from '@/core/theme/battleNetTheme';

const theme = createBattleNetTheme();

/** Storybook decorator for stories that use modals.open / confirmAction / promptAction. */
export const withMantineModals: Decorator = (Story) => (
	<MantineProvider theme={theme} cssVariablesResolver={battleNetCssVariablesResolver}>
		<ModalsProvider>
			<Story />
		</ModalsProvider>
	</MantineProvider>
);
