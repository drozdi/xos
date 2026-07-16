import { Box } from '@mantine/core';
import type { ReactNode } from 'react';

import { useAppContext } from '@/core/context/AppContext';

import { AppMenuRuntimeProvider } from './AppMenuContext';
import { AppTopMenuRoot } from './AppTopMenu';
import type { AppMenuConfig } from './types';

interface AppShellProps {
	children: ReactNode;
}

function isMenuLoader(
	value: AppMenuConfig | (() => Promise<AppMenuConfig>) | undefined,
): value is () => Promise<AppMenuConfig> {
	return typeof value === 'function';
}

export function AppShell({ children }: AppShellProps) {
	const { manifest } = useAppContext();
	const menu = manifest.menu;
	const menuConfig = menu && !isMenuLoader(menu) ? menu : undefined;
	const menuLoader = isMenuLoader(menu) ? menu : undefined;

	return (
		<AppMenuRuntimeProvider>
			<Box
				h="100%"
				style={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: 0,
				}}
			>
				<AppTopMenuRoot config={menuConfig} loader={menuLoader} />
				<Box
					style={{
						flex: 1,
						minHeight: 0,
						overflow: 'auto',
					}}
				>
					{children}
				</Box>
			</Box>
		</AppMenuRuntimeProvider>
	);
}
