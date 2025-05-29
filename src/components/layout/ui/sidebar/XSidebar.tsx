import { ScrollArea } from '@mantine/core';
import { useDisclosure, useMounted, useSetState } from '@mantine/hooks';
import classNames from 'classnames';
import React, {
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
	breakpoint?: string;
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
	forwardRef(function XSidebarFn(
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
	) {
		const innerRef = useRef<HTMLElement>();
		const layout = useXLayoutContext();
		const isMounted = useMounted();

		const hasHeader = title || toggle;

		const belowBreakpoint = useBreakpoint(breakpoint, layout?.width || 1000);

		/* my be ref */
		const breakPointFn = useCallback(
			(value) => {
				onBreakPoint?.(value);
			},
			[onBreakPoint],
		);
		useEffect(() => {
			breakPointFn(belowBreakpoint);
		}, [breakPointFn, belowBreakpoint]);

		const [{ width, miniWidth }, updateState] = useSetState({
			width: w,
			miniWidth: mW,
		});

		const [isOpenBreakpoint, openBreakpoint] = useDisclosure(false);

		const [innerMini, setInnerMini] = useState(mini);

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
					(miniOverlay || ((isEvents || mini) && overlay)) && !belowBreakpoint,
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
				toggleMini: (event) => {
					event?.preventDefault();
					event?.stopPropagation();
					if (false === onMini?.(ctx)) {
						return;
					}
					setInnerMini((v) => !v);
				},
				toggle: () => {
					if (false === onToggle?.(ctx)) {
						return;
					}
					openBreakpoint.toggle();
				},
			};
		}, [type, width, isMini, isOpen, onToggle, onMini]);

		useEffect(() => {
			const handleClose = ({ target }) => {
				if (target.closest('.x-sidebar') !== innerRef.current) {
					setInnerMini(true);
					openBreakpoint.close();
				}
			};
			if (miniMouse && (miniToggle || belowBreakpoint)) {
				document.addEventListener('click', handleClose);
			}
			return () => {
				document.removeEventListener('click', handleClose);
			};
		}, [miniMouse, miniToggle, belowBreakpoint]);

		useEffect(() => openBreakpoint.close(), [belowBreakpoint]);
		useEffect(() => openBreakpoint.toggle(), [open]);
		useEffect(() => setInnerMini(mini), [mini]);

		useEffect(() => {
			if (innerRef.current && typeof window !== 'undefined') {
				const style = window.getComputedStyle(innerRef.current);
				const _w = w || parseInt(style.width || 0, 10) || 0;
				const _mW = mW || parseInt(style.minWidth || 0, 10) || 0;
				_w && updateState({ width: _w });
				_mW && updateState({ miniWidth: _mW });
			}
		}, [w, mW]);

		useEffect(() => {
			if (layout && ctx) {
				layout.instances[type] = ctx;
			}
			return () => {
				if (layout) {
					delete layout.instances[type];
				}
			};
		}, [ctx, type, layout]);

		useImperativeHandle(ref, () => ctx, [ctx]);

		const [ss, setSs] = useState(true);

		return (
			<XSidebarProvider value={ctx}>
				<div
					className="x-sidebar-container"
					onMouseEnter={() => isMouseEvent && setInnerMini(false)}
					onMouseLeave={() => isMouseEvent && setInnerMini(true)}
				>
					<aside
						className={classNames('x-sidebar', {
							[`x-sidebar--${type}`]: type,
							'x-sidebar--close': !isOpen && isMounted,
							'x-sidebar--mini': isMini,
							'x-sidebar--overlay': isOverlay,
							'x-sidebar--mini-overlay': isMiniOverlay,
						})}
						ref={innerRef}
					>
						{hasHeader && (
							<XSidebarHeader>
								{title && <XSidebarTitle>{title}</XSidebarTitle>}
								{toggle && belowBreakpoint && <XSidebarToggleBtn />}
							</XSidebarHeader>
						)}
						<ScrollArea
							className={classNames('x-sidebar-content', className)}
						>
							{children}
						</ScrollArea>
						<XSidebarFooter>
							{miniToggle && !belowBreakpoint && <XSidebarMiniBtn />}
						</XSidebarFooter>
					</aside>
				</div>
			</XSidebarProvider>
		);
	}),
);
