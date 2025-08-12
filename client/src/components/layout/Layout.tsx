import { useSetState } from '@mantine/hooks';
import React, { memo, useMemo, useRef, useState } from 'react';
import { useBreakpoint } from '../../hooks/use-breakpoint';

import { ActionIcon, Burger } from '@mantine/core';
import { TbSquareArrowRight } from 'react-icons/tb';
import {
	Template,
	TemplateHasSlot,
	TemplateProvider,
	TemplateSlot,
	useTemplateContext,
} from './context';

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
	const context = useTemplateContext();
	const getTemplates = (slotName: string) => context.templates[slotName];
	const isTemplates = (slotName: string) => !!context.templates[slotName];

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
	const headerProps = useMemo(
		() => ({
			align: 'normal',
			className: 'x-layout-header',
			leftSection: belowBreakpoint && isTemplates?.('left') && (
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
			rightSection: belowBreakpoint && isTemplates?.('right') && (
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
					<TbSquareArrowRight
						style={{ width: '70%', height: '70%' }}
						stroke={1.5}
					/>
				</ActionIcon>
			),
		}),
		[belowBreakpoint],
	);

	//console.log(children);
	return (
		<TemplateProvider value={context}>
			<XLayout
				container={container}
				className={className}
				view={view}
				onResize={({ width }) => {
					setWidth(width);
				}}
				ref={layoutRef}
			>
				<TemplateHasSlot name="header">
					<XHeader {...headerProps}>
						<TemplateSlot name="header">asdsf</TemplateSlot>
					</XHeader>
				</TemplateHasSlot>
				<TemplateHasSlot name="footer">
					<XFooter className="x-layout-footer">
						<TemplateSlot name="footer">asdsf</TemplateSlot>
					</XFooter>
				</TemplateHasSlot>
				<TemplateHasSlot name="left">
					<XSidebar {...leftProps}>
						<TemplateSlot name="left">asdsf</TemplateSlot>
					</XSidebar>
				</TemplateHasSlot>
				<TemplateHasSlot name="right">
					<XSidebar {...rightProps}>
						<TemplateSlot name="right">asdsf</TemplateSlot>
					</XSidebar>
				</TemplateHasSlot>
				<XMain>{children}</XMain>
			</XLayout>
		</TemplateProvider>
	);
});

Layout.Header = ({ children }: { children: React.ReactNode }) => {
	return <Template slot="header">{children}</Template>;
};
Layout.Footer = ({ children }: { children: React.ReactNode }) => {
	return <Template slot="footer">{children}</Template>;
};
Layout.Left = ({ children }: { children: React.ReactNode }) => {
	return <Template slot="left">{children}</Template>;
};
Layout.Right = ({ children }: { children: React.ReactNode }) => {
	return <Template slot="right">{children}</Template>;
};
