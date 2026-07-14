import { Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMemo } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { useSetState, useSetting } from '@/core/settings/hooks';

import { LayoutProvider } from './LayoutContext';
import { parseView } from './parseView';

interface LayoutProps {
	children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
	const isMobile = useMediaQuery('(max-width: 767px)') ?? false;
	const [view] = useSetting('USER', 'layout.view', HKEY_CONFIG_DEFAULTS.layout.view);
	const [mobileView] = useSetting(
		'USER',
		'layout.mobileView',
		HKEY_CONFIG_DEFAULTS.layout.mobileView,
	);
	const [leftWidth, setLeftWidth] = useSetState<number>(
		'USER',
		'layout.panels.left.width',
		HKEY_CONFIG_DEFAULTS.layout.panels.left.width,
	);
	const [rightWidth, setRightWidth] = useSetState<number>(
		'USER',
		'layout.panels.right.width',
		HKEY_CONFIG_DEFAULTS.layout.panels.right.width,
	);

	const activeView = isMobile ? (mobileView ?? view) : view;
	const parsed = useMemo(() => {
		const collapsedStrip = 40;
		const effectiveLeft = leftWidth < 50 ? collapsedStrip : leftWidth;
		const effectiveRight = rightWidth < 50 ? collapsedStrip : rightWidth;

		return parseView(activeView ?? HKEY_CONFIG_DEFAULTS.layout.view, {
			left: effectiveLeft,
			right: effectiveRight,
		});
	}, [activeView, leftWidth, rightWidth]);

	const contextValue = useMemo(
		() => ({
			parsed,
			leftWidth,
			rightWidth,
			setLeftWidth,
			setRightWidth,
			isMobile,
		}),
		[parsed, leftWidth, rightWidth, setLeftWidth, setRightWidth, isMobile],
	);

	return (
		<LayoutProvider value={contextValue}>
			<Box
				bg="dark.8"
				style={{
					display: 'grid',
					width: '100vw',
					height: '100vh',
					overflow: 'hidden',
					gridTemplateAreas: parsed.templateAreas,
					gridTemplateColumns: parsed.templateColumns,
					gridTemplateRows: parsed.templateRows,
				}}
			>
				{children}
			</Box>
		</LayoutProvider>
	);
}
