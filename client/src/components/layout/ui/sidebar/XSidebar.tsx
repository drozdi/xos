import { Box, Portal, ScrollArea } from '@mantine/core';
import { useDisclosure, useMounted } from '@mantine/hooks';
import classNames from 'classnames';
import {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useBreakpoint } from '../../../../hooks/use-breakpoint';
import { useXLayoutContext } from '../layout';
import './style.css';
import { XSidebarProvider } from './XSidebarContext';
import { XSidebarFooter } from './XSidebarFooter';
import { XSidebarHeader } from './XSidebarHeader';
import { XSidebarMiniBtn } from './XSidebarMiniBtn';
import { XSidebarTitle } from './XSidebarTitle';
import { XSidebarToggleBtn } from './XSidebarToggleBtn';

export interface XSidebarProps {
	type: 'left' | 'right';
	title?: string;
	breakpoint?: number | string;
	className?: string;
	children?: React.ReactNode;
	mini?: boolean;
	miniOverlay?: boolean;
	miniToggle?: boolean;
	miniMouse?: boolean;
	open?: boolean;
	overlay?: boolean;
	resizeable?: boolean;
	toggle?: boolean;
	w?: number;
	mW?: number;
	onBreakPoint?: (value: boolean) => boolean | void;
	onResize?: (value: number) => void;
	onMini?: (value: any) => boolean | void;
	onToggle?: (value: any) => boolean | void;
}

export const XSidebar = memo(
	forwardRef(
		(
			{
				children,
				className,
				title,
				type = 'left',

				breakpoint,

				mini,
				miniOverlay,
				miniToggle,
				miniMouse,

				open,
				overlay,
				toggle,

				resizeable,
				w,
				mW,

				onBreakPoint,
				onResize,
				onMini,
				onToggle,
			}: XSidebarProps,
			ref: React.Ref<any>,
		) => {
			if (!children) {
				return null;
			}
			const innerRef = useRef<HTMLElement>(null);
			const layout = useXLayoutContext();
			const isMounted = useMounted();

			const hasHeader = title || toggle;

			const belowBreakpoint = useBreakpoint(breakpoint, layout?.width || 1000);

			/* my be ref */
			const breakPointFn = useCallback(
				(value: boolean) => onBreakPoint?.(value),
				[onBreakPoint],
			);
			useEffect(() => {
				breakPointFn(belowBreakpoint);
			}, [breakPointFn, belowBreakpoint]);

			const [width, setWidth] = useState<number | undefined>(w);
			const [miniWidth, setMiniWidth] = useState<number | undefined>(mW);
			const [innerMini, setInnerMini] = useState<boolean>(Boolean(mini));
			const [isOpenBreakpoint, openBreakpoint] = useDisclosure(false);

			const { isOpen, isOverlay, isEvents, isMouseEvent } = useMemo(
				() => ({
					isOpen: belowBreakpoint ? isOpenBreakpoint : open,
					isOverlay: overlay || (belowBreakpoint && miniOverlay),
					isEvents: !belowBreakpoint && (miniMouse || miniToggle),
					isMouseEvent: !belowBreakpoint && miniMouse && !miniToggle,
				}),
				[
					belowBreakpoint,
					isOpenBreakpoint,
					open,
					overlay,
					miniOverlay,
					miniMouse,
					miniToggle,
				],
			);

			const { isMiniOverlay, isMini } = useMemo(
				() => ({
					isMiniOverlay:
						(miniOverlay || ((isEvents || mini) && overlay)) &&
						!belowBreakpoint,
					isMini: isEvents ? innerMini : mini && !belowBreakpoint,
				}),
				[miniOverlay, overlay, innerMini, mini, isEvents, belowBreakpoint],
			);

			const ctx = useMemo(() => {
				return {
					type,
					width,
					mini: isMini,
					open: isOpen,
					getElement: () => innerRef.current,
					toggleMini: (event: React.MouseEvent) => {
						event?.preventDefault();
						event?.stopPropagation();
						if (false !== onMini?.(ctx)) {
							setInnerMini((v) => !v);
						}
					},
					toggle: (event: React.MouseEvent) => {
						event?.preventDefault();
						event?.stopPropagation();
						if (false !== onToggle?.(ctx)) {
							openBreakpoint.toggle();
						}
					},
				};
			}, [type, width, isMini, isOpen, onToggle, onMini]);

			useEffect(() => {
				const handleClose = ({ target }: MouseEvent): void => {
					if (
						(target as HTMLElement).closest('.x-sidebar') !== innerRef.current
					) {
						setInnerMini(true);
						openBreakpoint.close();
					}
				};
				if (miniMouse || (miniToggle && belowBreakpoint)) {
					document.addEventListener('click', handleClose);
				}
				return () => {
					document.removeEventListener('click', handleClose);
				};
			}, [miniMouse, miniToggle, belowBreakpoint]);

			useEffect(() => openBreakpoint.close(), [belowBreakpoint]);
			useEffect(() => openBreakpoint.toggle(), [open]);
			useEffect(() => setInnerMini(Boolean(mini)), [mini]);

			useEffect(() => {
				if (innerRef.current && typeof window !== 'undefined') {
					const style = window.getComputedStyle(innerRef.current);
					const _w = w || parseInt(style.width || '0', 10) || 0;
					const _mW = mW || parseInt(style.minWidth || '0', 10) || 0;
					_w && setWidth(_w);
					_mW && setMiniWidth(_mW);
				}
			}, [w, mW]);

			useImperativeHandle(ref, () => ctx, [ctx]);
			const [ss, setSs] = useState(false);
			return (
				<>
					<XSidebarProvider value={ctx}>
						<div
							className="x-sidebar-container"
							onMouseEnter={() => isMouseEvent && setInnerMini(false)}
							onMouseLeave={() => isMouseEvent && setInnerMini(true)}
						>
							<aside
								className={classNames(
									'x-sidebar',
									{
										[`x-sidebar--${type}`]: type,
										'x-sidebar--close': !isOpen && isMounted,
										'x-sidebar--mini': isMini,
										'x-sidebar--overlay': isOverlay,
										'x-sidebar--mini-overlay': isMiniOverlay,
									},
									className,
								)}
								ref={innerRef}
							>
								{hasHeader && (
									<XSidebarHeader>
										{title && <XSidebarTitle>{title}</XSidebarTitle>}
										{toggle && belowBreakpoint && (
											<XSidebarToggleBtn />
										)}
									</XSidebarHeader>
								)}
								<ScrollArea className="x-sidebar-content">
									{children}
								</ScrollArea>
								<XSidebarFooter>
									{miniToggle && !belowBreakpoint && (
										<XSidebarMiniBtn />
									)}
								</XSidebarFooter>
							</aside>
						</div>
					</XSidebarProvider>
					{true && (
						<Portal target="body">
							<Box
								pos="fixed"
								bg="rgba(0,0,0,0.5)"
								color="rgb(255,255,255)"
								top={64}
								right={0}
								w={ss ? '200' : 0}
								p={16}
								style={{
									zIndex: 1000,
								}}
							>
								fre:{' '}
								<input
									type="checkbox"
									checked={ss}
									onChange={() => setSs((v) => !v)}
								/>
								<br />
								breakpoint: {breakpoint} - {layout?.width}
								<br />
								mini: {mini ? 'true' : 'false'}
								<br />
								miniOverlay: {miniOverlay ? 'true' : 'false'}
								<br />
								miniToggle: {miniToggle ? 'true' : 'false'}
								<br />
								miniMouse: {miniMouse ? 'true' : 'false'}
								<br />
								open: {open ? 'true' : 'false'}
								<br />
								overlay: {overlay ? 'true' : 'false'}
								<br />
								toggle: {toggle ? 'true' : 'false'}
								<br />
								<br />
								belowBreakpoint: {belowBreakpoint ? 'true' : 'false'}
								<br />
								isEvents: {isEvents ? 'true' : 'false'}
								<br />
								isMouseEvent: {isMouseEvent ? 'true' : 'false'}
								<br />
								innerMini: {innerMini ? 'true' : 'false'}
								<br />
								isMini: {isMini ? 'true' : 'false'}
								<br />
								isOverlay: {isOverlay ? 'true' : 'false'}
								<br />
								isMiniOverlay: {isMiniOverlay ? 'true' : 'false'}
								<br />
								isOpenBreakpoint: {isOpenBreakpoint ? 'true' : 'false'}
								<br />
							</Box>
						</Portal>
					)}
				</>
			);
		},
	),
);
