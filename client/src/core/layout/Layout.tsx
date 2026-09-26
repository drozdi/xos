import { Alert, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { useSetState, useSetting } from '@/core/settings/hooks';

import { LayoutProvider } from './LayoutContext';
import { parseView } from './parseView';

interface LayoutProps {
	children: React.ReactNode;
	/** Явный view (перекрывает USER layout.view из settings) */
	view?: string;
	mobileView?: string;
}

function useOnlineStatus(): boolean {
	const [online, setOnline] = useState(
		typeof navigator === 'undefined' ? true : navigator.onLine,
	);

	useEffect(() => {
		const onOnline = () => setOnline(true);
		const onOffline = () => setOnline(false);
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
		};
	}, []);

	return online;
}

export function Layout({ children, view: viewProp, mobileView: mobileViewProp }: LayoutProps) {
	const isMobile = useMediaQuery('(max-width: 767px)', false, {
		getInitialValueInEffect: true,
	});
	const online = useOnlineStatus();
	const [storedView] = useSetting('USER', 'layout.view', HKEY_CONFIG_DEFAULTS.layout.view);
	const [storedMobileView] = useSetting(
		'USER',
		'layout.mobileView',
		HKEY_CONFIG_DEFAULTS.layout.mobileView,
	);
	const view = viewProp ?? storedView;
	const mobileView = mobileViewProp ?? storedMobileView;
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

	useEffect(() => {
		const root = document.documentElement;
		if (isMobile) {
			root.dataset.xosMobile = '1';
			document.body.classList.add('xos-mobile');
		} else {
			delete root.dataset.xosMobile;
			document.body.classList.remove('xos-mobile');
		}
		return () => {
			delete root.dataset.xosMobile;
			document.body.classList.remove('xos-mobile');
		};
	}, [isMobile]);

	const activeView = isMobile ? (mobileView ?? view) : view;
	const usesSidePanels = /[lr]/i.test(activeView?.replace(/\s/g, '') ?? '');
	const parsed = useMemo(() => {
		const collapsedStrip = 40;
		const effectiveLeft = usesSidePanels && leftWidth < 50 ? collapsedStrip : leftWidth;
		const effectiveRight = usesSidePanels && rightWidth < 50 ? collapsedStrip : rightWidth;

		return parseView(activeView ?? HKEY_CONFIG_DEFAULTS.layout.view, {
			left: effectiveLeft,
			right: effectiveRight,
		});
	}, [activeView, leftWidth, rightWidth, usesSidePanels]);

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
				style={{
					display: 'grid',
					width: '100vw',
					height: '100vh',
					overflow: 'hidden',
					gridTemplateAreas: parsed.templateAreas,
					gridTemplateColumns: parsed.templateColumns,
					gridTemplateRows: parsed.templateRows,
					backgroundColor: 'var(--mantine-color-body)',
					position: 'relative',
				}}
			>
				{!online ? (
					<Alert
						color="orange"
						title="Нет сети"
						radius={0}
						styles={{
							root: {
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								zIndex: 5000,
							},
						}}
					>
						Вы офлайн. Данные API могут быть из кэша Service Worker.
					</Alert>
				) : null}
				{children}
			</Box>
		</LayoutProvider>
	);
}
