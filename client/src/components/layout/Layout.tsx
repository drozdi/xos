import { useSetState } from '@mantine/hooks';
import React, { memo, useMemo, useRef, useState } from 'react';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useSlots } from '../../hooks/use-slots';

import { ActionIcon, Burger } from '@mantine/core';
import { IconSquareArrowRight } from '@tabler/icons-react';

import { XFooter, XHeader, XLayout, XMain, XSidebar } from './ui';

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

	const leftProps = useMemo(
		() => ({
			ref: leftSidebar,
			type: 'left',
			title: 'left',
			open: ls.open,
			overlay: overlay,
			breakpoint: breakpoint,
			toggle: belowBreakpoint,
			mini: ls.mini,
			miniOverlay: overlay || belowBreakpoint,
			miniMouse: true,
			miniToggle: toggle && !belowBreakpoint,
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
