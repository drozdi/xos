import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

import { battleNetCssVariablesResolver, createBattleNetTheme } from '@/core/theme/battleNetTheme';

const theme = createBattleNetTheme();

type StoryDecorator = (Story: () => ReactNode) => ReactNode;

/** Storybook decorator for stories that use modals.open / confirmAction / promptAction. */
export const withMantineModals: StoryDecorator = (Story) => (
	<MantineProvider theme={theme} cssVariablesResolver={battleNetCssVariablesResolver}>
		<ModalsProvider>
			<Story />
		</ModalsProvider>
	</MantineProvider>
);
