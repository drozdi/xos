import '@mantine/core/styles/AppShell.css';
import '@mantine/core/styles/Burger.css';
import '@mantine/core/styles/Button.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/Skeleton.css';
import { useSetState } from '@mantine/hooks';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useSlots } from '../../hooks/use-slots';
import './style.css';

import { ActionIcon, Burger } from '@mantine/core';
import { IconSquareArrowRight } from '@tabler/icons-react';

import { XFooter } from './ui/footer';
import { XHeader } from './ui/header';
import { XLayout } from './ui/layout';
import { XMain } from './ui/main';
import { XSidebar } from './ui/sidebar';

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
	container?: boolean;
	view?: string;
	breakpoint?: number;
	overlay?: boolean;
	toggle?: boolean;
}

export const Layout = memo(function LayoutFn({
	children,
	className,
	container,
	view = 'hhh lpr fff',
	breakpoint = 600,
	overlay,
	toggle,
}: LayoutProps) {
	const layoutRef = useRef(null);
	const [width, setWidth] = useState(0);

	const [ls, setLs] = useSetState({
		open: true,
		mini: false,
	});
	const [rs, setRs] = useSetState({
		open: true,
		mini: false,
	});

	const belowBreakpoint = useBreakpoint(breakpoint, width);

	const { slot, hasSlot, wrapSlot } = useSlots(children);

	const leftSidebar = useRef(null);

	useEffect(() => console.log(leftSidebar.current), [leftSidebar.current]);

	const leftProps = useMemo(
		() => ({
			ref: leftSidebar,
			type: 'left',
			open: ls.open,
			//overlay: overlay,
			breakpoint: breakpoint,
			//toggle: belowBreakpoint,
			toggle: true,
			mini: ls.mini,
			miniToggle: true,
			//miniOverlay: true,
			//miniMouse: true,
			//miniOverlay: overlay || belowBreakpoint,
			//miniMouse: true,
			//miniToggle: toggle && !belowBreakpoint,
			//resizeable: true,
			//onMini: (mini) => setLs({ mini }),
			//onResize: (width) => setLs({ width }),
			//onToggle: () => true,
		}),
		[ls, overlay, breakpoint, toggle, belowBreakpoint],
	);
	const rightProps = useMemo(
		() => ({
			type: 'right',
			open: rs.open,
			overlay: overlay,
			breakpoint: breakpoint,
			//toggle: belowBreakpoint,
			mini: rs.mini,
			miniOverlay: overlay || belowBreakpoint,
			miniMouse: true,
			miniToggle: toggle && !belowBreakpoint,
			//resizeable: true,
			//onMini: (mini) => setRs({ mini }),
			//onResize: (width) => setRs({ width }),
			//onToggle: () => true,
		}),
		[rs, overlay, breakpoint, toggle, belowBreakpoint],
	);

	const left = () => wrapSlot(slot('left', null), XSidebar, leftProps);
	const right = () => wrapSlot(slot('right', null), XSidebar, rightProps);
	const footer = () => wrapSlot(slot('footer', null), XFooter);

	const header = () =>
		wrapSlot(slot('header', null), XHeader, {
			align: 'normal',
			leftSection: belowBreakpoint && hasSlot('left') && (
				<Burger
					size="sm"
					opened={!leftSidebar.current?.open}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						setLs({ open: !ls.open });
					}}
				/>
				/*
				<ActionIcon
					variant="filled"
					size="lg"
					aria-label="Left"
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						setLs({ open: !ls.open });
					}}
				>
					<IconSquareArrowLeft
						style={{ width: '70%', height: '70%' }}
						stroke={1.5}
					/>
				</ActionIcon>*/
			),
			rightSection: belowBreakpoint && hasSlot('right') && (
				<ActionIcon
					variant="filled"
					size="lg"
					aria-label="Right"
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						setRs({ open: !rs.open });
					}}
				>
					<IconSquareArrowRight
						style={{ width: '70%', height: '70%' }}
						stroke={1.5}
					/>
				</ActionIcon>
			),
		});
	const def = () => wrapSlot(slot(), XMain);

	//console.log(children);
	return (
		<XLayout
			container={container}
			className={className}
			view={view}
			onResize={({ width }) => {
				setWidth(width);
			}}
			ref={layoutRef}
		>
			{hasSlot('left') && left()}
			{hasSlot('right') && right()}
			{hasSlot('header') && header()}
			{hasSlot('footer') && footer()}
			{def()}
		</XLayout>
	);
});
