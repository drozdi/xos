import { useSetState } from '@mantine/hooks';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useBreakpoint } from '../../hooks/use-breakpoint';

import { ActionIcon, Burger } from '@mantine/core';
import { TbSquareArrowRight } from 'react-icons/tb';
import { Template } from './context';

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

export const Layout = forwardRef(
	(
		{
			children,
			className,
			container,
			view = 'hhh lpr fff',
			breakpoint = 600,
			overlay,
			toggle,
		}: LayoutProps,
		ref: React.Ref<unknown>,
	) => {
		const context = Template.factory();
		const hasTemplate = (slotName: string): boolean => !!context.templates[slotName];
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
				leftSection: belowBreakpoint && hasTemplate?.('left') && (
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
				rightSection: belowBreakpoint && hasTemplate?.('right') && (
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

		const headerRef = useRef();
		const footerRef = useRef();
		const mainRef = useRef();
		useImperativeHandle(
			ref,
			() => ({
				refs: {
					header: headerRef.current,
					footer: footerRef.current,
					main: mainRef.current,
				},
			}),
			[],
		);
		return (
			<Template.Provider value={context}>
				<XLayout
					container={container}
					className={className}
					view={view}
					onResize={({ width }) => {
						setWidth(width);
					}}
					ref={layoutRef}
				>
					<Template.Has name="header">
						<XHeader {...headerProps} ref={headerRef}>
							<Template.Slot name="header" />
						</XHeader>
					</Template.Has>
					<Template.Has name="footer">
						<XFooter
							px="0"
							py="0"
							className="x-layout-footer"
							ref={footerRef}
						>
							<Template.Slot name="footer" />
						</XFooter>
					</Template.Has>
					<Template.Has name="left">
						<XSidebar
							className="x-layout-sidebar x-layout-sidebar--left"
							{...leftProps}
						>
							<Template.Slot name="left">asdsf</Template.Slot>
						</XSidebar>
					</Template.Has>
					<Template.Has name="right">
						<XSidebar
							className="x-layout-sidebar x-layout-sidebar--right"
							{...rightProps}
						>
							<Template.Slot name="right">asdsf</Template.Slot>
						</XSidebar>
					</Template.Has>
					<XMain className="x-layout-main" ref={mainRef}>
						{children}
					</XMain>
				</XLayout>
			</Template.Provider>
		);
	},
);

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
