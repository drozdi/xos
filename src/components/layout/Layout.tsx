import '@mantine/core/styles/AppShell.css';
import '@mantine/core/styles/Burger.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/Skeleton.css';
import { useSetState } from '@mantine/hooks';
import { memo, useMemo, useRef, useState } from 'react';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useSlots } from '../../hooks/use-slots';
import './style.css';

import { XFooter } from './ui/footer';
import { XHeader } from './ui/header';
import { XLayout } from './ui/layout';
import { XMain } from './ui/main';
import { XSidebar } from './ui/sidebar';

function XBtn() {
	return null;
}

export const Layout = memo(function LayoutFn({
	children,
	className,
	container,
	view = 'hhh lpr fff',
	breakpoint = 600,
	overlay,
	toggle,
}) {
	const layoutRef = useRef();
	const [width, setWidth] = useState(0);

	const [ls, updateLs] = useSetState({
		open: true,
		mini: false,
	});
	const [rs, updateRs] = useSetState({
		open: true,
		mini: false,
	});

	const belowBreakpoint = useBreakpoint(breakpoint, width);

	const { slot, hasSlot, wrapSlot } = useSlots(children);

	const leftProps = useMemo(
		() => ({
			type: 'left',
			open: ls.open,
			overlay: overlay,
			breakpoint: breakpoint,
			//toggle: belowBreakpoint,
			mini: ls.mini,
			miniOverlay: overlay || belowBreakpoint,
			miniMouse: true,
			miniToggle: toggle && !belowBreakpoint,
			//resizeable: true,
			onMini: (mini) => updateLs({ mini }),
			onResize: (width) => updateLs({ width }),
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
			onMini: (mini) => updateRs({ mini }),
			onResize: (width) => updateRs({ width }),
			//onToggle: () => true,
		}),
		[rs, overlay, breakpoint, toggle, belowBreakpoint],
	);

	const left = () => {
		return wrapSlot(slot('left', null), XSidebar, leftProps);
	};
	const right = () => {
		return wrapSlot(slot('right', null), XSidebar, rightProps);
	};
	const footer = () => {
		return wrapSlot(slot('footer', null), XFooter, { noPadding: true });
	};
	const header = () => {
		return wrapSlot(slot('header', null), XHeader, {
			align: 'normal',
			leftSection: belowBreakpoint && hasSlot('left') && (
				<XBtn
					color="primary"
					leftSection="mdi-dock-left"
					size="sm"
					square
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						updateLs({ open: !ls.open });
					}}
				/>
			),
			rightSection: belowBreakpoint && hasSlot('right') && (
				<XBtn
					color="primary"
					leftSection="mdi-dock-right"
					size="sm"
					square
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						updateRs({ open: !rs.open });
					}}
				/>
			),
		});
	};
	const def = () => {
		return wrapSlot(slot(), XMain);
	};

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
