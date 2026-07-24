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
			<div
				style={{
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					minHeight: 0,
				}}
			>
				<AppTopMenuRoot config={menuConfig} loader={menuLoader} />
				<div
					style={{
						flex: 1,
						minHeight: 0,
						overflow: 'auto',
					}}
				>
					{children}
				</div>
			</div>
		</AppMenuRuntimeProvider>
	);
}
